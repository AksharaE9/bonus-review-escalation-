import { eq, sql, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { escalations, escalationComments } from "@/db/schema/escalations";
import { withAudit } from "@/lib/audit";
import { can } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import {
  createEscalationSchema,
  updateEscalationStatusSchema,
  addEscalationCommentSchema,
  isValidTransition,
  CreateEscalationInput,
  UpdateEscalationStatusInput,
  AddEscalationCommentInput,
  EscStatus,
} from "@/lib/validators/escalation";
import type { SessionUser } from "@/types";

const SLA_HOURS: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 24,
  MEDIUM: 72,
  LOW: 120,
};

export const escalationService = {
  /**
   * Create a new escalation / complaint
   */
  async create(actor: SessionUser, input: CreateEscalationInput) {
    // 1. Validate permissions
    if (input.origin === "EMPLOYEE") {
      if (!can(actor, "raise_complaint")) {
        throw new Error("You are not authorized to raise a complaint");
      }
      // Rate limit employee complaints: 3 per hour per user
      const rl = rateLimit(`complaint_${actor.id}`, 3, 3600000);
      if (!rl.success) {
        throw new Error("Rate limit exceeded: You can submit at most 3 complaints per hour.");
      }
    } else {
      if (!can(actor, "raise_escalation_against_employee")) {
        throw new Error("You are not authorized to raise an escalation against an employee");
      }
      if (!input.subjectEmployeeId) {
        throw new Error("Subject employee is mandatory when management raises an escalation");
      }
    }

    // 2. Validate input schema
    const parsed = createEscalationSchema.parse(input);

    // 3. Compute SLA Due Date
    const slaHours = SLA_HOURS[parsed.severity] || 72;
    const dueAt = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    // 4. Generate unique ref code ESC-YYYY-XXXXX
    const year = new Date().getFullYear();
    const countRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(escalations);
    const num = (countRes[0]?.count ?? 0) + 1;
    const refCode = `ESC-${year}-${String(num).padStart(5, "0")}`;

    return await withAudit<typeof escalations.$inferSelect>(
      { actor },
      (newEsc) => ({
        action: "CREATE",
        entityType: "escalations",
        entityId: newEsc.id,
        entityLabel: `${newEsc.refCode} · ${newEsc.title}`,
        after: newEsc as unknown as Record<string, unknown>,
      }),
      async (tx) => {
        const [newEsc] = await tx
          .insert(escalations)
          .values({
            refCode,
            origin: parsed.origin,
            raisedBy: actor.id,
            subjectEmployeeId: parsed.subjectEmployeeId || null,
            assignedTo: parsed.assignedTo || null,
            category: parsed.category,
            severity: parsed.severity,
            title: parsed.title,
            description: parsed.description,
            status: "OPEN",
            isAnonymous: parsed.isAnonymous,
            isConfidential: parsed.isConfidential,
            dueAt,
          })
          .returning();

        return newEsc;
      }
    );
  },

  /**
   * Transition escalation status
   */
  async updateStatus(
    actor: SessionUser,
    refCode: string,
    input: UpdateEscalationStatusInput
  ) {
    const parsed = updateEscalationStatusSchema.parse(input);

    // Fetch existing escalation
    const [existing] = await db
      .select()
      .from(escalations)
      .where(and(eq(escalations.refCode, refCode), isNull(escalations.deletedAt)))
      .limit(1);

    if (!existing) {
      throw new Error("Escalation not found");
    }

    const currentStatus = existing.status as EscStatus;
    const targetStatus = parsed.status;

    // Check if transition is allowed by state machine
    if (!isValidTransition(currentStatus, targetStatus)) {
      throw new Error(
        `Illegal status transition from ${currentStatus} to ${targetStatus}`
      );
    }

    // Role permission checking
    const isRaiser = actor.id === existing.raisedBy;
    if (actor.role === "USER") {
      if (!isRaiser || targetStatus !== "WITHDRAWN") {
        throw new Error("Employees can only withdraw their own open escalations");
      }
    }

    if (existing.isConfidential && actor.role !== "ADMIN" && !isRaiser) {
      throw new Error("Escalation not found");
    }

    const now = new Date();
    const updates: Partial<typeof escalations.$inferInsert> = {
      status: targetStatus,
      updatedAt: now,
    };

    if (targetStatus === "ACKNOWLEDGED" && !existing.firstResponseAt) {
      updates.firstResponseAt = now;
    }

    if (targetStatus === "RESOLVED") {
      updates.resolution = parsed.resolution;
      updates.resolvedAt = now;
    }

    if (targetStatus === "CLOSED") {
      updates.resolution = parsed.resolution || existing.resolution;
      updates.closedAt = now;
    }

    if (currentStatus === "RESOLVED" && targetStatus === "IN_PROGRESS") {
      // Re-opening requires comment
      if (!parsed.comment || parsed.comment.trim().length < 5) {
        throw new Error("A comment is required when reopening an escalation");
      }
    }

    return await withAudit<typeof escalations.$inferSelect>(
      { actor },
      (updated) => ({
        action: "STATUS_CHANGE",
        entityType: "escalations",
        entityId: existing.id,
        entityLabel: `${existing.refCode} · ${existing.title}`,
        before: existing as unknown as Record<string, unknown>,
        after: updated as unknown as Record<string, unknown>,
      }),
      async (tx) => {
        const [updated] = await tx
          .update(escalations)
          .set(updates)
          .where(eq(escalations.id, existing.id))
          .returning();

        // Record status change comment in activity timeline
        const systemNote = parsed.comment
          ? `Status changed to ${targetStatus}: ${parsed.comment}`
          : `Status changed to ${targetStatus}`;

        await tx.insert(escalationComments).values({
          escalationId: existing.id,
          authorId: actor.id,
          body: systemNote,
          visibility: "SHARED",
          isStatusChange: true,
        });

        return updated;
      }
    );
  },

  /**
   * Add comment to escalation
   */
  async addComment(actor: SessionUser, input: AddEscalationCommentInput) {
    const parsed = addEscalationCommentSchema.parse(input);

    const [existing] = await db
      .select()
      .from(escalations)
      .where(and(eq(escalations.id, parsed.escalationId), isNull(escalations.deletedAt)))
      .limit(1);

    if (!existing) {
      throw new Error("Escalation not found");
    }

    // Role checks
    const isRaiser = actor.id === existing.raisedBy;
    const isSubject = actor.id === existing.subjectEmployeeId;

    if (actor.role === "USER") {
      if (!isRaiser && !isSubject) {
        throw new Error("Not authorized to comment on this escalation");
      }
      if (parsed.visibility === "INTERNAL") {
        throw new Error("Employees cannot post internal management notes");
      }
    }

    if (existing.isConfidential && actor.role !== "ADMIN" && !isRaiser) {
      throw new Error("Escalation not found");
    }

    return await withAudit<typeof escalationComments.$inferSelect>(
      { actor },
      (newComment) => ({
        action: "UPDATE",
        entityType: "escalations",
        entityId: existing.id,
        entityLabel: `Comment on ${existing.refCode}`,
        after: { commentId: newComment.id, visibility: newComment.visibility },
      }),
      async (tx) => {
        const [newComment] = await tx
          .insert(escalationComments)
          .values({
            escalationId: parsed.escalationId,
            authorId: actor.id,
            body: parsed.body,
            visibility: parsed.visibility,
            isStatusChange: false,
          })
          .returning();

        // Mark firstResponseAt if not set yet and author is management
        if (!existing.firstResponseAt && actor.role !== "USER") {
          await tx
            .update(escalations)
            .set({ firstResponseAt: new Date() })
            .where(eq(escalations.id, existing.id));
        }

        return newComment;
      }
    );
  },

  /**
   * Assign escalation to a user
   */
  async assign(actor: SessionUser, escalationId: string, assignedToUserId: string | null) {
    if (actor.role === "USER") {
      throw new Error("Only Admin and Leads can assign escalations");
    }

    const [existing] = await db
      .select()
      .from(escalations)
      .where(and(eq(escalations.id, escalationId), isNull(escalations.deletedAt)))
      .limit(1);

    if (!existing) {
      throw new Error("Escalation not found");
    }

    return await withAudit<typeof escalations.$inferSelect>(
      { actor },
      (updated) => ({
        action: "UPDATE",
        entityType: "escalations",
        entityId: existing.id,
        entityLabel: `Reassigned ${existing.refCode}`,
        before: existing as unknown as Record<string, unknown>,
        after: updated as unknown as Record<string, unknown>,
      }),
      async (tx) => {
        const [updated] = await tx
          .update(escalations)
          .set({ assignedTo: assignedToUserId, updatedAt: new Date() })
          .where(eq(escalations.id, escalationId))
          .returning();

        return updated;
      }
    );
  },
};
