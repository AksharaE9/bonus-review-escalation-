import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { bonuses } from "@/db/schema/bonuses";
import { users } from "@/db/schema/users";
import { notifications } from "@/db/schema/notifications";
import type { SessionUser } from "@/types";
import { can } from "@/lib/rbac";
import { withAudit, type AuditContext } from "@/lib/audit";
import type {
  CreateBonusInput,
  RejectBonusInput,
  MarkPaidBonusInput,
} from "@/lib/validators/bonus";
import { formatINR, toNumericString } from "@/lib/money";

export const bonusService = {
  /**
   * Create a new bonus
   */
  async createBonus(
    actor: SessionUser,
    input: CreateBonusInput,
    auditCtx: AuditContext
  ) {
    if (!can(actor, "create_bonus")) {
      throw new Error("UNAUTHORIZED: You do not have permission to create bonuses.");
    }

    const cleanAmount = toNumericString(input.amount);

    // Check setting for auto-approval
    let initialStatus: "PENDING_APPROVAL" | "APPROVED" = "PENDING_APPROVAL";
    if (actor.role === "ADMIN") {
      initialStatus = "APPROVED";
    }

    // Fetch target employee for entity label
    const empRows = await db
      .select({ fullName: users.fullName, email: users.email })
      .from(users)
      .where(eq(users.id, input.employeeId))
      .limit(1);

    const empName = empRows[0]?.fullName || "Employee";

    return await withAudit<typeof bonuses.$inferSelect>(
      auditCtx,
      (newBonus) => ({
        action: "CREATE",
        entityType: "BONUS",
        entityId: newBonus.id,
        entityLabel: `Bonus ${formatINR(cleanAmount)} · ${empName} (${input.bonusType})`,
        before: null,
        after: {
          id: newBonus.id,
          employeeId: input.employeeId,
          amount: cleanAmount,
          currency: input.currency,
          bonusType: input.bonusType,
          reason: input.reason,
          status: initialStatus,
          awardedBy: actor.id,
        },
      }),
      async (tx) => {
        const [inserted] = await tx
          .insert(bonuses)
          .values({
            employeeId: input.employeeId,
            amount: cleanAmount,
            currency: input.currency || "INR",
            bonusType: input.bonusType,
            reason: input.reason,
            periodMonth: input.periodMonth || null,
            status: initialStatus,
            awardedBy: actor.id,
            approvedBy: initialStatus === "APPROVED" ? actor.id : null,
            approvedAt: initialStatus === "APPROVED" ? new Date() : null,
            linkedReviewId: input.linkedReviewId || null,
          })
          .returning();

        // If approved directly, notify employee
        if (initialStatus === "APPROVED") {
          await tx.insert(notifications).values({
            userId: input.employeeId,
            type: "BONUS_APPROVED",
            title: "Bonus Approved",
            body: `Congratulations! A ${input.bonusType} bonus of ${formatINR(cleanAmount)} has been approved.`,
            link: `/employees/${input.employeeId}?tab=bonus`,
          });
        }

        return inserted;
      }
    );
  },

  /**
   * Approve a pending bonus (ADMIN only)
   */
  async approveBonus(
    actor: SessionUser,
    bonusId: string,
    auditCtx: AuditContext
  ) {
    if (!can(actor, "approve_bonus")) {
      throw new Error("UNAUTHORIZED: Only Administrators can approve bonuses.");
    }

    const currentRows = await db
      .select()
      .from(bonuses)
      .innerJoin(users, eq(bonuses.employeeId, users.id))
      .where(eq(bonuses.id, bonusId))
      .limit(1);

    if (!currentRows || currentRows.length === 0) {
      throw new Error("Bonus record not found.");
    }

    const current = currentRows[0].bonuses;
    const emp = currentRows[0].users;

    if (current.status !== "PENDING_APPROVAL") {
      throw new Error(`Cannot approve a bonus in '${current.status}' status.`);
    }

    return await withAudit(
      auditCtx,
      {
        action: "STATUS_CHANGE",
        entityType: "BONUS",
        entityId: bonusId,
        entityLabel: `Bonus Approved · ${formatINR(current.amount)} · ${emp.fullName}`,
        before: { status: current.status },
        after: { status: "APPROVED", approvedBy: actor.id, approvedAt: new Date().toISOString() },
      },
      async (tx) => {
        const [updated] = await tx
          .update(bonuses)
          .set({
            status: "APPROVED",
            approvedBy: actor.id,
            approvedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(bonuses.id, bonusId))
          .returning();

        // Notify employee
        await tx.insert(notifications).values({
          userId: current.employeeId,
          type: "BONUS_APPROVED",
          title: "Bonus Approved",
          body: `Your bonus of ${formatINR(current.amount)} has been approved by ${actor.fullName}.`,
          link: `/employees/${current.employeeId}?tab=bonus`,
        });

        return updated;
      }
    );
  },

  /**
   * Reject a pending bonus with mandatory reason (ADMIN only)
   */
  async rejectBonus(
    actor: SessionUser,
    input: RejectBonusInput,
    auditCtx: AuditContext
  ) {
    if (!can(actor, "approve_bonus")) {
      throw new Error("UNAUTHORIZED: Only Administrators can reject bonuses.");
    }

    const currentRows = await db
      .select()
      .from(bonuses)
      .innerJoin(users, eq(bonuses.employeeId, users.id))
      .where(eq(bonuses.id, input.bonusId))
      .limit(1);

    if (!currentRows || currentRows.length === 0) {
      throw new Error("Bonus record not found.");
    }

    const current = currentRows[0].bonuses;
    const emp = currentRows[0].users;

    return await withAudit(
      auditCtx,
      {
        action: "STATUS_CHANGE",
        entityType: "BONUS",
        entityId: input.bonusId,
        entityLabel: `Bonus Rejected · ${formatINR(current.amount)} · ${emp.fullName}`,
        before: { status: current.status, rejectionReason: current.rejectionReason },
        after: { status: "REJECTED", rejectionReason: input.rejectionReason },
      },
      async (tx) => {
        const [updated] = await tx
          .update(bonuses)
          .set({
            status: "REJECTED",
            rejectionReason: input.rejectionReason,
            updatedAt: new Date(),
          })
          .where(eq(bonuses.id, input.bonusId))
          .returning();

        // Notify nominator (awardedBy)
        await tx.insert(notifications).values({
          userId: current.awardedBy,
          type: "BONUS_REJECTED",
          title: "Bonus Nomination Rejected",
          body: `Bonus nomination for ${emp.fullName} was rejected: "${input.rejectionReason}"`,
          link: `/bonuses`,
        });

        return updated;
      }
    );
  },

  /**
   * Mark an approved bonus as PAID with payout date (ADMIN only)
   */
  async markPaid(
    actor: SessionUser,
    input: MarkPaidBonusInput,
    auditCtx: AuditContext
  ) {
    if (!can(actor, "approve_bonus")) {
      throw new Error("UNAUTHORIZED: Only Administrators can mark bonuses as paid.");
    }

    const currentRows = await db
      .select()
      .from(bonuses)
      .innerJoin(users, eq(bonuses.employeeId, users.id))
      .where(eq(bonuses.id, input.bonusId))
      .limit(1);

    if (!currentRows || currentRows.length === 0) {
      throw new Error("Bonus record not found.");
    }

    const current = currentRows[0].bonuses;
    const emp = currentRows[0].users;

    return await withAudit(
      auditCtx,
      {
        action: "STATUS_CHANGE",
        entityType: "BONUS",
        entityId: input.bonusId,
        entityLabel: `Bonus Marked Paid · ${formatINR(current.amount)} · ${emp.fullName}`,
        before: { status: current.status, payoutDate: current.payoutDate },
        after: { status: "PAID", payoutDate: input.payoutDate },
      },
      async (tx) => {
        const [updated] = await tx
          .update(bonuses)
          .set({
            status: "PAID",
            payoutDate: input.payoutDate,
            updatedAt: new Date(),
          })
          .where(eq(bonuses.id, input.bonusId))
          .returning();

        // Notify employee
        await tx.insert(notifications).values({
          userId: current.employeeId,
          type: "BONUS_PAID",
          title: "Bonus Disbursed",
          body: `Your bonus payout of ${formatINR(current.amount)} has been disbursed.`,
          link: `/employees/${current.employeeId}?tab=bonus`,
        });

        return updated;
      }
    );
  },

  /**
   * Bulk approve pending bonuses (ADMIN only)
   */
  async bulkApprove(
    actor: SessionUser,
    bonusIds: string[],
    auditCtx: AuditContext
  ) {
    if (!can(actor, "approve_bonus")) {
      throw new Error("UNAUTHORIZED: Only Administrators can bulk approve bonuses.");
    }

    return await withAudit(
      auditCtx,
      {
        action: "STATUS_CHANGE",
        entityType: "BONUS",
        entityId: null,
        entityLabel: `Bulk approved ${bonusIds.length} bonuses`,
        before: { status: "PENDING_APPROVAL", ids: bonusIds },
        after: { status: "APPROVED", count: bonusIds.length },
      },
      async (tx) => {
        const updated = await tx
          .update(bonuses)
          .set({
            status: "APPROVED",
            approvedBy: actor.id,
            approvedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            inArray(bonuses.id, bonusIds)
          )
          .returning();

        return updated;
      }
    );
  },
};
