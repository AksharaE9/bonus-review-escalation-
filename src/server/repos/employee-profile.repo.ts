import "server-only";
import { eq, and, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { bonuses } from "@/db/schema/bonuses";
import { reviews } from "@/db/schema/reviews";
import { escalations } from "@/db/schema/escalations";
import type { SessionUser, PublicUser } from "@/types";
import { can } from "@/lib/rbac";

export interface EmployeeProfileSummary {
  employee: PublicUser;
  stats: {
    totalBonusApprovedYtd: string;
    totalBonusCount: number;
    latestReviewRating: string | null;
    openEscalationsCount: number;
  };
  tabCounts: {
    overview: number;
    bonuses: number;
    reviews: number;
    escalations: number;
    audit: number;
  };
}

export interface ActivityTimelineItem {
  id: string;
  type: "BONUS" | "REVIEW" | "ESCALATION";
  title: string;
  subtitle: string;
  date: string;
  status: string;
  badgeVariant?: "default" | "success" | "warning" | "danger" | "info" | "secondary";
  href?: string;
  amount?: string;
  rating?: string;
}

export const employeeProfileRepo = {
  /**
   * Fetches employee profile, summary metrics, and tab count chips in a single consolidated DB query.
   * Adheres strictly to Neon cold-start and zero-N+1 discipline.
   */
  async getProfileHeaderAndStats(
    actor: SessionUser,
    employeeId: string
  ): Promise<EmployeeProfileSummary | null> {
    const isSelf = actor.id === employeeId;

    if (!isSelf && !can(actor, "view_employee_profile")) {
      return null;
    }

    // Single consolidated aggregation query via SQL subqueries
    const result = await db.execute(sql`
      SELECT
        u.id,
        u.employee_code,
        u.email,
        u.full_name,
        u.avatar_url,
        u.role,
        u.department_id,
        d.name as department_name,
        d.code as department_code,
        u.manager_id,
        m.full_name as manager_name,
        u.designation,
        u.date_of_joining,
        u.phone,
        u.status,
        u.must_change_password,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        u.deleted_at,

        -- Aggregated Stats in same round-trip:
        COALESCE(
          (SELECT sum(b.amount)
           FROM bonuses b
           WHERE b.employee_id = u.id
             AND b.status IN ('APPROVED', 'PAID')
             AND b.deleted_at IS NULL),
          0
        )::numeric(12,2) as total_bonus_ytd,

        (SELECT count(*)::int
         FROM bonuses b
         WHERE b.employee_id = u.id
           AND b.deleted_at IS NULL
           AND (${actor.role === "USER" ? sql`b.status IN ('APPROVED', 'PAID')` : sql`true`})
        ) as bonus_count,

        (SELECT r.overall_rating
         FROM reviews r
         WHERE r.employee_id = u.id
           AND r.deleted_at IS NULL
           AND (${actor.role === "USER" ? sql`r.status IN ('SUBMITTED', 'ACKNOWLEDGED', 'CLOSED')` : sql`true`})
         ORDER BY r.period_end DESC
         LIMIT 1) as latest_rating,

        (SELECT count(*)::int
         FROM escalations e
         WHERE e.subject_employee_id = u.id
           AND e.deleted_at IS NULL
           AND e.status NOT IN ('RESOLVED', 'CLOSED', 'WITHDRAWN')
           AND (${actor.role === "LEAD" ? sql`e.is_confidential = false` : sql`true`})
        ) as open_escalations_count,

        (SELECT count(*)::int
         FROM reviews r
         WHERE r.employee_id = u.id
           AND r.deleted_at IS NULL
           AND (${actor.role === "USER" ? sql`r.status IN ('SUBMITTED', 'ACKNOWLEDGED', 'CLOSED')` : sql`true`})
        ) as review_count,

        (SELECT count(*)::int
         FROM escalations e
         WHERE e.subject_employee_id = u.id
           AND e.deleted_at IS NULL
           AND (${actor.role === "LEAD" ? sql`e.is_confidential = false` : sql`true`})
        ) as total_escalations_count,

        (SELECT count(*)::int
         FROM audit_logs a
         WHERE (a.entity_type = 'USER' AND a.entity_id = u.id::text)
            OR (a.entity_type = 'BONUS' AND a.entity_id IN (SELECT b.id::text FROM bonuses b WHERE b.employee_id = u.id))
            OR (a.entity_type = 'REVIEW' AND a.entity_id IN (SELECT r.id::text FROM reviews r WHERE r.employee_id = u.id))
            OR (a.entity_type = 'ESCALATION' AND a.entity_id IN (SELECT e.ref_code FROM escalations e WHERE e.subject_employee_id = u.id))
        ) as audit_count

      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE u.id = ${employeeId}::uuid
        AND (${actor.role === "ADMIN" ? sql`true` : sql`u.deleted_at IS NULL`})
      LIMIT 1;
    `);

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as Record<string, unknown>;

    // Check LEAD scope
    if (actor.role === "LEAD" && !isSelf) {
      const allowed = can(actor, "view_employee_profile", {
        targetUserId: String(row.id),
        targetDepartmentId: row.department_id ? String(row.department_id) : null,
        targetManagerId: row.manager_id ? String(row.manager_id) : null,
      });
      if (!allowed) return null;
    }

    const publicUser: PublicUser = {
      id: String(row.id),
      employeeCode: String(row.employee_code),
      email: String(row.email),
      fullName: String(row.full_name),
      avatarUrl: (row.avatar_url as string | null) ?? null,
      role: row.role as PublicUser["role"],
      departmentId: (row.department_id as string | null) ?? null,
      departmentName: (row.department_name as string | null) ?? null,
      departmentCode: (row.department_code as string | null) ?? null,
      managerId: (row.manager_id as string | null) ?? null,
      managerName: (row.manager_name as string | null) ?? null,
      designation: (row.designation as string | null) ?? null,
      dateOfJoining: row.date_of_joining ? String(row.date_of_joining) : null,
      phone: (row.phone as string | null) ?? null,
      status: row.status as PublicUser["status"],
      mustChangePassword: Boolean(row.must_change_password),
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at as string | number | Date).toISOString() : null,
      createdAt: new Date(row.created_at as string | number | Date).toISOString(),
      updatedAt: new Date((row.updated_at || row.created_at) as string | number | Date).toISOString(),
      deletedAt: row.deleted_at ? new Date(row.deleted_at as string | number | Date).toISOString() : null,
    };

    const totalBonuses = Number(row.bonus_count ?? 0);
    const totalReviews = Number(row.review_count ?? 0);
    const totalEscalations = Number(row.total_escalations_count ?? 0);

    return {
      employee: publicUser,
      stats: {
        totalBonusApprovedYtd: String(row.total_bonus_ytd ?? "0.00"),
        totalBonusCount: totalBonuses,
        latestReviewRating: row.latest_rating ? String(row.latest_rating) : null,
        openEscalationsCount: Number(row.open_escalations_count ?? 0),
      },
      tabCounts: {
        overview: totalBonuses + totalReviews + totalEscalations,
        bonuses: totalBonuses,
        reviews: totalReviews,
        escalations: totalEscalations,
        audit: Number(row.audit_count ?? 0),
      },
    };
  },

  /**
   * Fetches unified reverse-chronological timeline activity for the employee
   */
  async getOverviewTimeline(
    actor: SessionUser,
    employeeId: string
  ): Promise<ActivityTimelineItem[]> {
    const isSelf = actor.id === employeeId;

    if (!isSelf && !can(actor, "view_employee_profile")) {
      return [];
    }

    const items: ActivityTimelineItem[] = [];

    // 1. Bonuses
    const bonusRows = await db
      .select({
        id: bonuses.id,
        amount: bonuses.amount,
        type: bonuses.bonusType,
        reason: bonuses.reason,
        status: bonuses.status,
        createdAt: bonuses.createdAt,
      })
      .from(bonuses)
      .where(
        and(
          eq(bonuses.employeeId, employeeId),
          isNull(bonuses.deletedAt),
          actor.role === "USER"
            ? sql`${bonuses.status} IN ('APPROVED', 'PAID')`
            : undefined
        )
      )
      .orderBy(sql`${bonuses.createdAt} DESC`)
      .limit(10);

    for (const b of bonusRows) {
      items.push({
        id: b.id,
        type: "BONUS",
        title: `Bonus Awarded (${b.type})`,
        subtitle: b.reason,
        date: new Date(b.createdAt).toISOString(),
        status: b.status,
        amount: b.amount,
      });
    }

    // 2. Reviews
    const reviewRows = await db
      .select({
        id: reviews.id,
        reviewType: reviews.reviewType,
        overallRating: reviews.overallRating,
        summary: reviews.summary,
        status: reviews.status,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(
        and(
          eq(reviews.employeeId, employeeId),
          isNull(reviews.deletedAt),
          actor.role === "USER"
            ? sql`${reviews.status} IN ('SUBMITTED', 'ACKNOWLEDGED', 'CLOSED')`
            : undefined
        )
      )
      .orderBy(sql`${reviews.createdAt} DESC`)
      .limit(10);

    for (const r of reviewRows) {
      items.push({
        id: r.id,
        type: "REVIEW",
        title: `Performance Review (${r.reviewType})`,
        subtitle: r.summary,
        date: new Date(r.createdAt).toISOString(),
        status: r.status,
        rating: r.overallRating ?? undefined,
      });
    }

    // 3. Escalations
    const escRows = await db
      .select({
        id: escalations.id,
        refCode: escalations.refCode,
        title: escalations.title,
        severity: escalations.severity,
        status: escalations.status,
        isConfidential: escalations.isConfidential,
        createdAt: escalations.createdAt,
      })
      .from(escalations)
      .where(
        and(
          eq(escalations.subjectEmployeeId, employeeId),
          isNull(escalations.deletedAt),
          actor.role === "LEAD"
            ? eq(escalations.isConfidential, false)
            : undefined
        )
      )
      .orderBy(sql`${escalations.createdAt} DESC`)
      .limit(10);

    for (const e of escRows) {
      items.push({
        id: e.id,
        type: "ESCALATION",
        title: `Escalation [${e.refCode}]: ${e.title}`,
        subtitle: `Severity: ${e.severity}`,
        date: new Date(e.createdAt).toISOString(),
        status: e.status,
      });
    }

    // Sort combined timeline reverse-chronologically
    items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return items;
  },
};
