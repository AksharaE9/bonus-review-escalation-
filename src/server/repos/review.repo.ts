import "server-only";
import { SQL, eq, and, isNull, desc, sql, or } from "drizzle-orm";
import { db } from "@/db";
import { reviews, reviewRatings, competencies, reviewCycles } from "@/db/schema/reviews";
import { users } from "@/db/schema/users";
import { departments } from "@/db/schema/departments";
import type { SessionUser, ReviewStatus, ReviewType, PaginatedResult } from "@/types";
import { can } from "@/lib/rbac";

export interface ReviewRatingRow {
  competencyId: string;
  competencyName: string;
  weight: string;
  score: string;
  comment: string | null;
}

export interface ReviewRow {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string | null;
  reviewerId: string;
  reviewerName: string;
  cycleId: string | null;
  cycleName: string | null;
  reviewType: ReviewType;
  periodStart: string;
  periodEnd: string;
  overallRating: string | null;
  summary: string;
  strengths: string | null;
  improvements: string | null;
  goals: Array<{ goal: string; targetDate?: string; completed?: boolean }>;
  status: ReviewStatus;
  visibility: string;
  employeeComment: string | null;
  acknowledgedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ratings?: ReviewRatingRow[];
}

export const reviewRepo = {
  /**
   * List reviews for a specific employee
   */
  async listForEmployee(
    actor: SessionUser,
    employeeId: string
  ): Promise<ReviewRow[]> {
    const isSelf = actor.id === employeeId;

    if (!isSelf && !can(actor, "view_employee_profile")) {
      return [];
    }

    const conditions = [
      eq(reviews.employeeId, employeeId),
      isNull(reviews.deletedAt),
    ];

    if (actor.role === "USER") {
      conditions.push(sql`${reviews.status} IN ('SUBMITTED', 'ACKNOWLEDGED', 'CLOSED')`);
    }

    const rawRows = await db
      .select({
        id: reviews.id,
        employeeId: reviews.employeeId,
        employeeName: users.fullName,
        employeeCode: users.employeeCode,
        departmentName: departments.name,
        reviewerId: reviews.reviewerId,
        cycleId: reviews.cycleId,
        cycleName: reviewCycles.name,
        reviewType: reviews.reviewType,
        periodStart: reviews.periodStart,
        periodEnd: reviews.periodEnd,
        overallRating: reviews.overallRating,
        summary: reviews.summary,
        strengths: reviews.strengths,
        improvements: reviews.improvements,
        goals: reviews.goals,
        status: reviews.status,
        visibility: reviews.visibility,
        employeeComment: reviews.employeeComment,
        acknowledgedAt: reviews.acknowledgedAt,
        submittedAt: reviews.submittedAt,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.employeeId, users.id))
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .leftJoin(reviewCycles, eq(reviews.cycleId, reviewCycles.id))
      .where(and(...conditions)!)
      .orderBy(desc(reviews.periodEnd));

    const result: ReviewRow[] = [];

    for (const r of rawRows) {
      // Fetch ratings for each review
      const ratings = await db
        .select({
          competencyId: reviewRatings.competencyId,
          competencyName: competencies.name,
          weight: competencies.weight,
          score: reviewRatings.score,
          comment: reviewRatings.comment,
        })
        .from(reviewRatings)
        .innerJoin(competencies, eq(reviewRatings.competencyId, competencies.id))
        .where(eq(reviewRatings.reviewId, r.id))
        .orderBy(competencies.sortOrder);

      result.push({
        id: r.id,
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        employeeCode: r.employeeCode,
        departmentName: r.departmentName ?? null,
        reviewerId: r.reviewerId,
        reviewerName: r.reviewerId,
        cycleId: r.cycleId,
        cycleName: r.cycleName ?? null,
        reviewType: r.reviewType,
        periodStart: String(r.periodStart),
        periodEnd: String(r.periodEnd),
        overallRating: r.overallRating ? String(r.overallRating) : null,
        summary: r.summary,
        strengths: r.strengths,
        improvements: r.improvements,
        goals: (r.goals as Array<{ goal: string; targetDate?: string; completed?: boolean }>) || [],
        status: r.status,
        visibility: r.visibility,
        employeeComment: r.employeeComment,
        acknowledgedAt: r.acknowledgedAt ? new Date(r.acknowledgedAt).toISOString() : null,
        submittedAt: r.submittedAt ? new Date(r.submittedAt).toISOString() : null,
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString(),
        ratings,
      });
    }

    return result;
  },

  /**
   * Master reviews listing with filters
   */
  async list(
    actor: SessionUser,
    filters: {
      status?: string;
      reviewType?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<PaginatedResult<ReviewRow>> {
    const { status, reviewType, search, page = 1, pageSize = 25 } = filters;
    const conditions = [isNull(reviews.deletedAt)];

    if (actor.role === "USER") {
      conditions.push(eq(reviews.employeeId, actor.id));
      conditions.push(sql`${reviews.status} IN ('SUBMITTED', 'ACKNOWLEDGED', 'CLOSED')`);
    } else if (actor.role === "LEAD") {
      if (actor.departmentId) {
        conditions.push(
          or(
            eq(users.departmentId, actor.departmentId),
            eq(users.managerId, actor.id),
            eq(reviews.reviewerId, actor.id),
            eq(reviews.employeeId, actor.id)
          )!
        );
      }
    }

    if (status) conditions.push(eq(reviews.status, status as ReviewStatus));
    if (reviewType) conditions.push(eq(reviews.reviewType, reviewType as ReviewType));

    if (search && search.trim() !== "") {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          sql`${users.fullName} ILIKE ${term}`,
          sql`${users.employeeCode} ILIKE ${term}`,
          sql`${reviews.summary} ILIKE ${term}`
        )!
      );
    }

    const whereClause = and(...conditions) as SQL;

    const countRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reviews)
      .innerJoin(users, eq(reviews.employeeId, users.id))
      .where(whereClause);

    const total = countRes[0]?.count ?? 0;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    const rawRows = await db
      .select({
        id: reviews.id,
        employeeId: reviews.employeeId,
        employeeName: users.fullName,
        employeeCode: users.employeeCode,
        departmentName: departments.name,
        reviewerId: reviews.reviewerId,
        cycleId: reviews.cycleId,
        cycleName: reviewCycles.name,
        reviewType: reviews.reviewType,
        periodStart: reviews.periodStart,
        periodEnd: reviews.periodEnd,
        overallRating: reviews.overallRating,
        summary: reviews.summary,
        strengths: reviews.strengths,
        improvements: reviews.improvements,
        goals: reviews.goals,
        status: reviews.status,
        visibility: reviews.visibility,
        employeeComment: reviews.employeeComment,
        acknowledgedAt: reviews.acknowledgedAt,
        submittedAt: reviews.submittedAt,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.employeeId, users.id))
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .leftJoin(reviewCycles, eq(reviews.cycleId, reviewCycles.id))
      .where(whereClause)
      .orderBy(desc(reviews.periodEnd))
      .limit(pageSize)
      .offset(offset);

    const rows: ReviewRow[] = rawRows.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.employeeName,
      employeeCode: r.employeeCode,
      departmentName: r.departmentName ?? null,
      reviewerId: r.reviewerId,
      reviewerName: r.reviewerId,
      cycleId: r.cycleId,
      cycleName: r.cycleName ?? null,
      reviewType: r.reviewType,
      periodStart: String(r.periodStart),
      periodEnd: String(r.periodEnd),
      overallRating: r.overallRating ? String(r.overallRating) : null,
      summary: r.summary,
      strengths: r.strengths,
      improvements: r.improvements,
      goals: (r.goals as Array<{ goal: string; targetDate?: string; completed?: boolean }>) || [],
      status: r.status,
      visibility: r.visibility,
      employeeComment: r.employeeComment,
      acknowledgedAt: r.acknowledgedAt ? new Date(r.acknowledgedAt).toISOString() : null,
      submittedAt: r.submittedAt ? new Date(r.submittedAt).toISOString() : null,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString(),
    }));

    return {
      rows,
      total,
      page,
      pageSize,
      totalPages,
    };
  },
};
