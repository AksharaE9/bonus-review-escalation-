import "server-only";
import { eq, and, sql, isNull, desc, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { bonuses } from "@/db/schema/bonuses";
import { reviews } from "@/db/schema/reviews";
import { escalations } from "@/db/schema/escalations";
import { auditLogs } from "@/db/schema/audit";
import { departments } from "@/db/schema/departments";
import type { SessionUser } from "@/types";

export interface AdminDashboardData {
  stats: {
    totalEmployees: number;
    fyBonusSpend: string;
    pendingBonusesCount: number;
    openEscalationsCount: number;
    overdueEscalationsCount: number;
    reviewsPendingCount: number;
  };
  bonusSpendTrend: Array<{ month: string; spend: number }>;
  escalationTrend: Array<{ period: string; opened: number; resolved: number }>;
  pendingBonuses: Array<{
    id: string;
    employeeName: string;
    employeeCode: string;
    departmentName: string | null;
    amount: string;
    currency: string;
    bonusType: string;
    reason: string;
    awardedByName: string;
    createdAt: string;
  }>;
  criticalEscalations: Array<{
    id: string;
    refCode: string;
    title: string;
    severity: string;
    status: string;
    slaBreached: boolean;
    dueAt: string | null;
    raisedByName: string;
  }>;
  recentAuditLogs: Array<{
    id: number;
    actorEmail: string | null;
    actorRole: string | null;
    action: string;
    entityType: string;
    entityLabel: string | null;
    createdAt: string;
  }>;
}

export interface LeadDashboardData {
  stats: {
    teamSize: number;
    pendingTeamBonuses: number;
    openTeamEscalations: number;
    reviewsPendingFromMe: number;
  };
  teamRoster: Array<{
    id: string;
    fullName: string;
    employeeCode: string;
    designation: string | null;
    avatarUrl: string | null;
    totalBonusYtd: string;
    latestRating: number | null;
    openEscalations: number;
  }>;
  pendingActions: Array<{
    id: string;
    type: "BONUS" | "REVIEW" | "ESCALATION";
    title: string;
    subtitle: string;
    link: string;
    date: string;
  }>;
}

export interface UserDashboardData {
  stats: {
    ytdBonusTotal: string;
    latestRating: number | null;
    openComplaintsCount: number;
  };
  unacknowledgedReviews: Array<{
    id: string;
    reviewerName: string;
    periodEnd: string;
    overallRating: number | null;
    summary: string;
  }>;
  recentBonuses: Array<{
    id: string;
    amount: string;
    currency: string;
    bonusType: string;
    reason: string;
    awardedByName: string;
    status: string;
    createdAt: string;
  }>;
  recentReviews: Array<{
    id: string;
    reviewType: string;
    reviewerName: string;
    periodStart: string;
    periodEnd: string;
    overallRating: number | null;
    status: string;
  }>;
  recentEscalations: Array<{
    id: string;
    refCode: string;
    title: string;
    severity: string;
    status: string;
    createdAt: string;
  }>;
}

export const dashboardRepo = {
  /**
   * Admin dashboard aggregate queries (≤ 4 roundtrips)
   */
  async getAdminData(actor?: SessionUser): Promise<AdminDashboardData> {
    if (actor && actor.role !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required.");
    }
    const now = new Date();
    // FY starts April 1st
    const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const fyStartDate = `${currentYear}-04-01`;

    // 1. Consolidated Key Metrics
    const [empCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(isNull(users.deletedAt), eq(users.status, "ACTIVE")));

    const [bonusMetrics] = await db
      .select({
        fySpend: sql<string>`coalesce(sum(case when ${bonuses.status} in ('APPROVED','PAID') and ${bonuses.createdAt} >= ${fyStartDate}::date then ${bonuses.amount} else 0 end), 0)::text`,
        pendingCount: sql<number>`count(case when ${bonuses.status} = 'PENDING_APPROVAL' and ${bonuses.deletedAt} is null then 1 end)::int`,
      })
      .from(bonuses);

    const [escMetrics] = await db
      .select({
        openCount: sql<number>`count(case when ${escalations.status} not in ('RESOLVED','CLOSED','WITHDRAWN') and ${escalations.deletedAt} is null then 1 end)::int`,
        overdueCount: sql<number>`count(case when ${escalations.status} not in ('RESOLVED','CLOSED','WITHDRAWN') and ${escalations.dueAt} < ${now} and ${escalations.deletedAt} is null then 1 end)::int`,
      })
      .from(escalations);

    const [reviewMetrics] = await db
      .select({
        pendingCount: sql<number>`count(case when ${reviews.status} in ('DRAFT','SUBMITTED') and ${reviews.deletedAt} is null then 1 end)::int`,
      })
      .from(reviews);

    // 2. 12-Month Bonus Spend Trend
    const bonusSpendRaw = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${bonuses.createdAt}), 'Mon YYYY')`,
        monthDate: sql<string>`date_trunc('month', ${bonuses.createdAt})`,
        spend: sql<number>`coalesce(sum(${bonuses.amount}), 0)::float`,
      })
      .from(bonuses)
      .where(and(inArray(bonuses.status, ["APPROVED", "PAID"]), isNull(bonuses.deletedAt)))
      .groupBy(sql`date_trunc('month', ${bonuses.createdAt})`, sql`to_char(date_trunc('month', ${bonuses.createdAt}), 'Mon YYYY')`)
      .orderBy(sql`date_trunc('month', ${bonuses.createdAt}) ASC`)
      .limit(12);

    // 3. 12-Week Escalations Trend
    const escTrendRaw = await db
      .select({
        period: sql<string>`to_char(date_trunc('week', ${escalations.createdAt}), 'DD Mon')`,
        opened: sql<number>`count(*)::int`,
        resolved: sql<number>`count(case when ${escalations.status} in ('RESOLVED','CLOSED') then 1 end)::int`,
      })
      .from(escalations)
      .where(isNull(escalations.deletedAt))
      .groupBy(sql`date_trunc('week', ${escalations.createdAt})`)
      .orderBy(sql`date_trunc('week', ${escalations.createdAt}) ASC`)
      .limit(12);

    // 4. Panel Lists: Pending Bonuses, Critical Escalations, Recent Audits
    const pendingBonusRows = await db
      .select({
        id: bonuses.id,
        amount: bonuses.amount,
        currency: bonuses.currency,
        bonusType: bonuses.bonusType,
        reason: bonuses.reason,
        createdAt: bonuses.createdAt,
        employeeName: users.fullName,
        employeeCode: users.employeeCode,
        departmentName: departments.name,
        awardedByName: sql<string>`(select full_name from users where id = ${bonuses.awardedBy})`,
      })
      .from(bonuses)
      .innerJoin(users, eq(bonuses.employeeId, users.id))
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .where(and(eq(bonuses.status, "PENDING_APPROVAL"), isNull(bonuses.deletedAt)))
      .orderBy(desc(bonuses.createdAt))
      .limit(5);

    const criticalEscRows = await db
      .select({
        id: escalations.id,
        refCode: escalations.refCode,
        title: escalations.title,
        severity: escalations.severity,
        status: escalations.status,
        dueAt: escalations.dueAt,
        raisedByName: users.fullName,
      })
      .from(escalations)
      .leftJoin(users, eq(escalations.raisedBy, users.id))
      .where(
        and(
          isNull(escalations.deletedAt),
          or(
            eq(escalations.severity, "CRITICAL"),
            eq(escalations.severity, "HIGH"),
            sql`${escalations.dueAt} < ${now} AND ${escalations.status} NOT IN ('RESOLVED','CLOSED','WITHDRAWN')`
          )!
        )
      )
      .orderBy(desc(escalations.createdAt))
      .limit(5);

    const auditRows = await db
      .select({
        id: auditLogs.id,
        actorEmail: auditLogs.actorEmail,
        actorRole: auditLogs.actorRole,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityLabel: auditLogs.entityLabel,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(10);

    return {
      stats: {
        totalEmployees: empCount?.count ?? 0,
        fyBonusSpend: bonusMetrics?.fySpend ?? "0.00",
        pendingBonusesCount: bonusMetrics?.pendingCount ?? 0,
        openEscalationsCount: escMetrics?.openCount ?? 0,
        overdueEscalationsCount: escMetrics?.overdueCount ?? 0,
        reviewsPendingCount: reviewMetrics?.pendingCount ?? 0,
      },
      bonusSpendTrend: bonusSpendRaw.map((b) => ({ month: b.month, spend: b.spend })),
      escalationTrend: escTrendRaw.map((e) => ({
        period: e.period,
        opened: e.opened,
        resolved: e.resolved,
      })),
      pendingBonuses: pendingBonusRows.map((b) => ({
        id: b.id,
        employeeName: b.employeeName,
        employeeCode: b.employeeCode,
        departmentName: b.departmentName,
        amount: b.amount,
        currency: b.currency,
        bonusType: b.bonusType,
        reason: b.reason,
        awardedByName: b.awardedByName || "Manager",
        createdAt: new Date(b.createdAt).toISOString(),
      })),
      criticalEscalations: criticalEscRows.map((e) => ({
        id: e.id,
        refCode: e.refCode,
        title: e.title,
        severity: e.severity,
        status: e.status,
        slaBreached: Boolean(
          e.dueAt &&
            new Date(e.dueAt) < now &&
            !["RESOLVED", "CLOSED", "WITHDRAWN"].includes(e.status)
        ),
        dueAt: e.dueAt ? new Date(e.dueAt).toISOString() : null,
        raisedByName: e.raisedByName || "Employee",
      })),
      recentAuditLogs: auditRows.map((a) => ({
        id: Number(a.id),
        actorEmail: a.actorEmail,
        actorRole: a.actorRole,
        action: a.action,
        entityType: a.entityType,
        entityLabel: a.entityLabel,
        createdAt: new Date(a.createdAt).toISOString(),
      })),
    };
  },

  /**
   * Lead dashboard aggregate queries (scoped to department/team)
   */
  async getLeadData(actor: SessionUser): Promise<LeadDashboardData> {
    const deptId = actor.departmentId;

    // Team members condition
    const teamConditions = [isNull(users.deletedAt)];
    if (deptId) {
      teamConditions.push(or(eq(users.departmentId, deptId), eq(users.managerId, actor.id))!);
    } else {
      teamConditions.push(eq(users.managerId, actor.id));
    }

    const teamUsers = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        employeeCode: users.employeeCode,
        designation: users.designation,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(and(...teamConditions))
      .limit(10);

    const teamUserIds = teamUsers.map((u) => u.id);

    let pendingTeamBonuses = 0;
    let openTeamEscalations = 0;

    if (teamUserIds.length > 0) {
      const [bonusCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(bonuses)
        .where(
          and(
            inArray(bonuses.employeeId, teamUserIds),
            eq(bonuses.status, "PENDING_APPROVAL"),
            isNull(bonuses.deletedAt)
          )
        );
      pendingTeamBonuses = bonusCount?.count ?? 0;

      const [escCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(escalations)
        .where(
          and(
            inArray(escalations.subjectEmployeeId, teamUserIds),
            sql`${escalations.status} NOT IN ('RESOLVED','CLOSED','WITHDRAWN')`,
            isNull(escalations.deletedAt),
            eq(escalations.isConfidential, false)
          )
        );
      openTeamEscalations = escCount?.count ?? 0;
    }

    const [reviewsFromMe] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reviews)
      .where(
        and(
          eq(reviews.reviewerId, actor.id),
          eq(reviews.status, "DRAFT"),
          isNull(reviews.deletedAt)
        )
      );

    // Build team roster metrics
    const teamRoster = await Promise.all(
      teamUsers.map(async (u) => {
        const [bonusTotal] = await db
          .select({
            total: sql<string>`coalesce(sum(${bonuses.amount}), 0)::text`,
          })
          .from(bonuses)
          .where(
            and(
              eq(bonuses.employeeId, u.id),
              inArray(bonuses.status, ["APPROVED", "PAID"]),
              isNull(bonuses.deletedAt)
            )
          );

        const [latestRev] = await db
          .select({ rating: reviews.overallRating })
          .from(reviews)
          .where(
            and(
              eq(reviews.employeeId, u.id),
              inArray(reviews.status, ["SUBMITTED", "ACKNOWLEDGED", "CLOSED"]),
              isNull(reviews.deletedAt)
            )
          )
          .orderBy(desc(reviews.periodEnd))
          .limit(1);

        const [openEsc] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(escalations)
          .where(
            and(
              eq(escalations.subjectEmployeeId, u.id),
              sql`${escalations.status} NOT IN ('RESOLVED','CLOSED','WITHDRAWN')`,
              isNull(escalations.deletedAt)
            )
          );

        return {
          id: u.id,
          fullName: u.fullName,
          employeeCode: u.employeeCode,
          designation: u.designation,
          avatarUrl: u.avatarUrl,
          totalBonusYtd: bonusTotal?.total ?? "0.00",
          latestRating: latestRev?.rating ? Number(latestRev.rating) : null,
          openEscalations: openEsc?.count ?? 0,
        };
      })
    );

    // Action items
    const pendingActions: LeadDashboardData["pendingActions"] = [];

    const draftReviews = await db
      .select({
        id: reviews.id,
        employeeName: users.fullName,
        periodEnd: reviews.periodEnd,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.employeeId, users.id))
      .where(
        and(
          eq(reviews.reviewerId, actor.id),
          eq(reviews.status, "DRAFT"),
          isNull(reviews.deletedAt)
        )
      )
      .limit(3);

    draftReviews.forEach((r) => {
      pendingActions.push({
        id: r.id,
        type: "REVIEW",
        title: `Draft Review for ${r.employeeName}`,
        subtitle: "Review composition is in progress and pending submission",
        link: `/reviews/new?employeeId=${r.id}`,
        date: new Date(r.createdAt).toISOString(),
      });
    });

    return {
      stats: {
        teamSize: teamUsers.length,
        pendingTeamBonuses,
        openTeamEscalations,
        reviewsPendingFromMe: reviewsFromMe?.count ?? 0,
      },
      teamRoster,
      pendingActions,
    };
  },

  /**
   * User personal dashboard aggregate queries
   */
  async getUserData(actor: SessionUser): Promise<UserDashboardData> {
    // 1. Personal Key Metrics
    const [bonusMetrics] = await db
      .select({
        ytdTotal: sql<string>`coalesce(sum(${bonuses.amount}), 0)::text`,
      })
      .from(bonuses)
      .where(
        and(
          eq(bonuses.employeeId, actor.id),
          inArray(bonuses.status, ["APPROVED", "PAID"]),
          isNull(bonuses.deletedAt)
        )
      );

    const [latestReview] = await db
      .select({ overallRating: reviews.overallRating })
      .from(reviews)
      .where(
        and(
          eq(reviews.employeeId, actor.id),
          inArray(reviews.status, ["SUBMITTED", "ACKNOWLEDGED", "CLOSED"]),
          isNull(reviews.deletedAt)
        )
      )
      .orderBy(desc(reviews.periodEnd))
      .limit(1);

    const [complaintCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(escalations)
      .where(
        and(
          eq(escalations.raisedBy, actor.id),
          sql`${escalations.status} NOT IN ('RESOLVED','CLOSED','WITHDRAWN')`,
          isNull(escalations.deletedAt)
        )
      );

    // 2. Unacknowledged Reviews Banner items
    const unacknowledgedReviewsRaw = await db
      .select({
        id: reviews.id,
        periodEnd: reviews.periodEnd,
        overallRating: reviews.overallRating,
        summary: reviews.summary,
        reviewerName: users.fullName,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.reviewerId, users.id))
      .where(
        and(
          eq(reviews.employeeId, actor.id),
          eq(reviews.status, "SUBMITTED"),
          isNull(reviews.acknowledgedAt),
          isNull(reviews.deletedAt)
        )
      );

    // 3. Recent items
    const recentBonusesRaw = await db
      .select({
        id: bonuses.id,
        amount: bonuses.amount,
        currency: bonuses.currency,
        bonusType: bonuses.bonusType,
        reason: bonuses.reason,
        status: bonuses.status,
        createdAt: bonuses.createdAt,
        awardedByName: users.fullName,
      })
      .from(bonuses)
      .leftJoin(users, eq(bonuses.awardedBy, users.id))
      .where(
        and(
          eq(bonuses.employeeId, actor.id),
          inArray(bonuses.status, ["APPROVED", "PAID"]),
          isNull(bonuses.deletedAt)
        )
      )
      .orderBy(desc(bonuses.createdAt))
      .limit(5);

    const recentReviewsRaw = await db
      .select({
        id: reviews.id,
        reviewType: reviews.reviewType,
        periodStart: reviews.periodStart,
        periodEnd: reviews.periodEnd,
        overallRating: reviews.overallRating,
        status: reviews.status,
        reviewerName: users.fullName,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.reviewerId, users.id))
      .where(
        and(
          eq(reviews.employeeId, actor.id),
          inArray(reviews.status, ["SUBMITTED", "ACKNOWLEDGED", "CLOSED"]),
          isNull(reviews.deletedAt)
        )
      )
      .orderBy(desc(reviews.periodEnd))
      .limit(5);

    const recentEscalationsRaw = await db
      .select({
        id: escalations.id,
        refCode: escalations.refCode,
        title: escalations.title,
        severity: escalations.severity,
        status: escalations.status,
        createdAt: escalations.createdAt,
      })
      .from(escalations)
      .where(
        and(
          or(
            eq(escalations.raisedBy, actor.id),
            eq(escalations.subjectEmployeeId, actor.id)
          )!,
          isNull(escalations.deletedAt)
        )
      )
      .orderBy(desc(escalations.createdAt))
      .limit(5);

    return {
      stats: {
        ytdBonusTotal: bonusMetrics?.ytdTotal ?? "0.00",
        latestRating: latestReview?.overallRating ? Number(latestReview.overallRating) : null,
        openComplaintsCount: complaintCount?.count ?? 0,
      },
      unacknowledgedReviews: unacknowledgedReviewsRaw.map((r) => ({
        id: r.id,
        reviewerName: r.reviewerName || "Reviewer",
        periodEnd: r.periodEnd,
        overallRating: r.overallRating ? Number(r.overallRating) : null,
        summary: r.summary,
      })),
      recentBonuses: recentBonusesRaw.map((b) => ({
        id: b.id,
        amount: b.amount,
        currency: b.currency,
        bonusType: b.bonusType,
        reason: b.reason,
        awardedByName: b.awardedByName || "Management",
        status: b.status,
        createdAt: new Date(b.createdAt).toISOString(),
      })),
      recentReviews: recentReviewsRaw.map((r) => ({
        id: r.id,
        reviewType: r.reviewType,
        reviewerName: r.reviewerName || "Lead",
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        overallRating: r.overallRating ? Number(r.overallRating) : null,
        status: r.status,
      })),
      recentEscalations: recentEscalationsRaw.map((e) => ({
        id: e.id,
        refCode: e.refCode,
        title: e.title,
        severity: e.severity,
        status: e.status,
        createdAt: new Date(e.createdAt).toISOString(),
      })),
    };
  },
};
