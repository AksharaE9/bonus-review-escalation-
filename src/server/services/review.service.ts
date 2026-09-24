import { eq } from "drizzle-orm";
import { db } from "@/db";
import { reviews, reviewRatings, competencies } from "@/db/schema/reviews";
import { users } from "@/db/schema/users";
import { notifications } from "@/db/schema/notifications";
import type { SessionUser } from "@/types";
import { can } from "@/lib/rbac";
import { withAudit, type AuditContext } from "@/lib/audit";
import {
  type SaveReviewInput,
  type AcknowledgeReviewInput,
  calculateWeightedOverallScore,
} from "@/lib/validators/review";

export const reviewService = {
  /**
   * Create or update a review draft or submit final review
   */
  async saveReview(
    actor: SessionUser,
    input: SaveReviewInput,
    auditCtx: AuditContext
  ) {
    if (!can(actor, "write_review")) {
      throw new Error("UNAUTHORIZED: You do not have permission to write reviews.");
    }

    const isNew = !input.id;
    const targetStatus = input.isDraft ? "DRAFT" : "SUBMITTED";

    // 1. Fetch competencies to calculate overall rating if not manually overridden
    let finalRating = input.overallRating;
    if (!input.isRatingOverridden && input.ratings && input.ratings.length > 0) {
      const activeCompetencies = await db
        .select({ id: competencies.id, weight: competencies.weight })
        .from(competencies);

      const computed = calculateWeightedOverallScore(
        input.ratings,
        activeCompetencies
      );
      if (computed > 0) {
        finalRating = computed;
      }
    }

    // Fetch employee details for entity label
    const empRows = await db
      .select({ fullName: users.fullName, email: users.email })
      .from(users)
      .where(eq(users.id, input.employeeId))
      .limit(1);
    const empName = empRows[0]?.fullName || "Employee";

    return await withAudit<typeof reviews.$inferSelect>(
      auditCtx,
      (revRecord) => ({
        action: isNew ? "CREATE" : "UPDATE",
        entityType: "REVIEW",
        entityId: revRecord.id,
        entityLabel: `Performance Review (${input.reviewType}) · ${empName}`,
        before: isNew ? null : { status: "DRAFT" },
        after: {
          id: revRecord.id,
          employeeId: input.employeeId,
          reviewerId: actor.id,
          reviewType: input.reviewType,
          overallRating: finalRating ? String(finalRating) : null,
          status: targetStatus,
          summary: input.summary,
        },
      }),
      async (tx) => {
        let reviewId = input.id;
        let revRecord: typeof reviews.$inferSelect;

        if (isNew || !reviewId) {
          const [inserted] = await tx
            .insert(reviews)
            .values({
              employeeId: input.employeeId,
              reviewerId: actor.id,
              cycleId: input.cycleId || null,
              reviewType: input.reviewType,
              periodStart: input.periodStart,
              periodEnd: input.periodEnd,
              overallRating: finalRating ? finalRating.toFixed(1) : null,
              summary: input.summary,
              strengths: input.strengths || null,
              improvements: input.improvements || null,
              goals: input.goals,
              status: targetStatus,
              visibility: input.visibility,
              submittedAt: targetStatus === "SUBMITTED" ? new Date() : null,
            })
            .returning();
          revRecord = inserted;
          reviewId = inserted.id;
        } else {
          // Verify review is not already acknowledged (locked against edits)
          const existing = await tx
            .select()
            .from(reviews)
            .where(eq(reviews.id, reviewId!))
            .limit(1);

          if (existing[0]?.status === "ACKNOWLEDGED" || existing[0]?.status === "CLOSED") {
            throw new Error("LOCKED: An acknowledged review cannot be modified.");
          }

          const [updated] = await tx
            .update(reviews)
            .set({
              employeeId: input.employeeId,
              cycleId: input.cycleId || null,
              reviewType: input.reviewType,
              periodStart: input.periodStart,
              periodEnd: input.periodEnd,
              overallRating: finalRating ? finalRating.toFixed(1) : null,
              summary: input.summary,
              strengths: input.strengths || null,
              improvements: input.improvements || null,
              goals: input.goals,
              status: targetStatus,
              visibility: input.visibility,
              submittedAt: targetStatus === "SUBMITTED" ? new Date() : null,
              updatedAt: new Date(),
            })
            .where(eq(reviews.id, reviewId!))
            .returning();
          revRecord = updated;
        }

        // 2. Insert/Upsert Competency Ratings
        if (input.ratings && input.ratings.length > 0 && reviewId) {
          // Clear existing ratings for this review to replace cleanly
          await tx
            .delete(reviewRatings)
            .where(eq(reviewRatings.reviewId, reviewId));

          await tx.insert(reviewRatings).values(
            input.ratings.map((r) => ({
              reviewId: reviewId!,
              competencyId: r.competencyId,
              score: r.score.toFixed(1),
              comment: r.comment || null,
            }))
          );
        }

        // 3. Notify employee if submitted
        if (targetStatus === "SUBMITTED") {
          await tx.insert(notifications).values({
            userId: input.employeeId,
            type: "REVIEW_SUBMITTED",
            title: "Performance Review Submitted",
            body: `Your manager submitted your ${input.reviewType} performance evaluation. Please review and acknowledge.`,
            link: `/employees/${input.employeeId}?tab=reviews`,
          });
        }

        return revRecord;
      }
    );
  },

  /**
   * Employee acknowledges review with optional comment
   */
  async acknowledgeReview(
    actor: SessionUser,
    input: AcknowledgeReviewInput,
    auditCtx: AuditContext
  ) {
    const existing = await db
      .select()
      .from(reviews)
      .innerJoin(users, eq(reviews.employeeId, users.id))
      .where(eq(reviews.id, input.reviewId))
      .limit(1);

    if (!existing || existing.length === 0) {
      throw new Error("Review not found.");
    }

    const rev = existing[0].reviews;
    const emp = existing[0].users;

    // Check ownership
    if (!can(actor, "acknowledge_review", { targetUserId: rev.employeeId })) {
      throw new Error("UNAUTHORIZED: You can only acknowledge reviews written for yourself.");
    }

    if (rev.status !== "SUBMITTED") {
      throw new Error(`Cannot acknowledge review in status '${rev.status}'.`);
    }

    return await withAudit(
      auditCtx,
      {
        action: "STATUS_CHANGE",
        entityType: "REVIEW",
        entityId: rev.id,
        entityLabel: `Review Acknowledged · ${emp.fullName}`,
        before: { status: rev.status },
        after: {
          status: "ACKNOWLEDGED",
          acknowledgedAt: new Date().toISOString(),
          employeeComment: input.employeeComment || null,
        },
      },
      async (tx) => {
        const [updated] = await tx
          .update(reviews)
          .set({
            status: "ACKNOWLEDGED",
            employeeComment: input.employeeComment || null,
            acknowledgedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(reviews.id, input.reviewId))
          .returning();

        // Notify reviewer
        await tx.insert(notifications).values({
          userId: rev.reviewerId,
          type: "REVIEW_ACKNOWLEDGED",
          title: "Review Acknowledged",
          body: `${emp.fullName} has acknowledged their ${rev.reviewType} performance review.`,
          link: `/employees/${rev.employeeId}?tab=reviews`,
        });

        return updated;
      }
    );
  },
};
