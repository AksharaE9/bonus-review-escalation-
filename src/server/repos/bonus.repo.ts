import "server-only";
import { SQL, eq, and, isNull, desc, sql, or } from "drizzle-orm";
import { db } from "@/db";
import { bonuses } from "@/db/schema/bonuses";
import { users } from "@/db/schema/users";
import { departments } from "@/db/schema/departments";
import type { SessionUser, BonusStatus, BonusType, PaginatedResult } from "@/types";
import { can } from "@/lib/rbac";

export interface BonusRow {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  employeeEmail: string;
  departmentName: string | null;
  amount: string;
  currency: string;
  bonusType: BonusType;
  reason: string;
  periodMonth: string | null;
  status: BonusStatus;
  awardedBy: string;
  awardedByName: string;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  payoutDate: string | null;
  linkedReviewId: string | null;
  createdAt: string;
  updatedAt: string;
}

export const bonusRepo = {
  /**
   * Find bonus by ID with strict scoping and visibility rules
   */
  async findById(actor: SessionUser, bonusId: string): Promise<BonusRow | null> {
    const raw = await db
      .select({
        id: bonuses.id,
        employeeId: bonuses.employeeId,
        employeeName: users.fullName,
        employeeCode: users.employeeCode,
        employeeEmail: users.email,
        employeeDeptId: users.departmentId,
        employeeManagerId: users.managerId,
        departmentName: departments.name,
        amount: bonuses.amount,
        currency: bonuses.currency,
        bonusType: bonuses.bonusType,
        reason: bonuses.reason,
        periodMonth: bonuses.periodMonth,
        status: bonuses.status,
        awardedBy: bonuses.awardedBy,
        approvedBy: bonuses.approvedBy,
        approvedAt: bonuses.approvedAt,
        rejectionReason: bonuses.rejectionReason,
        payoutDate: bonuses.payoutDate,
        linkedReviewId: bonuses.linkedReviewId,
        createdAt: bonuses.createdAt,
        updatedAt: bonuses.updatedAt,
        deletedAt: bonuses.deletedAt,
      })
      .from(bonuses)
      .innerJoin(users, eq(bonuses.employeeId, users.id))
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .where(and(eq(bonuses.id, bonusId), isNull(bonuses.deletedAt)))
      .limit(1);

    if (!raw || raw.length === 0) return null;
    const b = raw[0];

    const isSelf = actor.id === b.employeeId;

    // Enforce employee visibility rule: USER only sees APPROVED or PAID
    if (isSelf && actor.role === "USER") {
      if (b.status !== "APPROVED" && b.status !== "PAID") {
        return null; // 404
      }
    }

    // Enforce LEAD visibility
    if (!isSelf && actor.role === "LEAD") {
      const allowed = can(actor, "view_unapproved_bonus_of_others", {
        targetUserId: b.employeeId,
        targetDepartmentId: b.employeeDeptId,
        targetManagerId: b.employeeManagerId,
      });
      if (!allowed) return null;
    }

    if (!isSelf && actor.role === "USER") {
      return null;
    }

    return {
      id: b.id,
      employeeId: b.employeeId,
      employeeName: b.employeeName,
      employeeCode: b.employeeCode,
      employeeEmail: b.employeeEmail,
      departmentName: b.departmentName ?? null,
      amount: b.amount,
      currency: b.currency,
      bonusType: b.bonusType,
      reason: b.reason,
      periodMonth: b.periodMonth ? String(b.periodMonth) : null,
      status: b.status,
      awardedBy: b.awardedBy,
      awardedByName: b.awardedBy,
      approvedBy: b.approvedBy ?? null,
      approvedByName: b.approvedBy ?? null,
      approvedAt: b.approvedAt ? new Date(b.approvedAt).toISOString() : null,
      rejectionReason: b.rejectionReason ?? null,
      payoutDate: b.payoutDate ? String(b.payoutDate) : null,
      linkedReviewId: b.linkedReviewId ?? null,
      createdAt: new Date(b.createdAt).toISOString(),
      updatedAt: new Date(b.updatedAt).toISOString(),
    };
  },

  /**
   * List bonuses for a specific employee (used on Profile page Bonus tab)
   */
  async listForEmployee(
    actor: SessionUser,
    employeeId: string
  ): Promise<BonusRow[]> {
    const isSelf = actor.id === employeeId;

    if (!isSelf && !can(actor, "view_employee_profile")) {
      return [];
    }

    const conditions = [
      eq(bonuses.employeeId, employeeId),
      isNull(bonuses.deletedAt),
    ];

    // Employee sees only APPROVED and PAID
    if (actor.role === "USER") {
      conditions.push(sql`${bonuses.status} IN ('APPROVED', 'PAID')`);
    }

    const rows = await db
      .select({
        id: bonuses.id,
        employeeId: bonuses.employeeId,
        employeeName: users.fullName,
        employeeCode: users.employeeCode,
        employeeEmail: users.email,
        departmentName: departments.name,
        amount: bonuses.amount,
        currency: bonuses.currency,
        bonusType: bonuses.bonusType,
        reason: bonuses.reason,
        periodMonth: bonuses.periodMonth,
        status: bonuses.status,
        awardedBy: bonuses.awardedBy,
        approvedBy: bonuses.approvedBy,
        approvedAt: bonuses.approvedAt,
        rejectionReason: bonuses.rejectionReason,
        payoutDate: bonuses.payoutDate,
        linkedReviewId: bonuses.linkedReviewId,
        createdAt: bonuses.createdAt,
        updatedAt: bonuses.updatedAt,
      })
      .from(bonuses)
      .innerJoin(users, eq(bonuses.employeeId, users.id))
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .where(and(...conditions)!)
      .orderBy(desc(bonuses.createdAt));

    return rows.map((b) => ({
      id: b.id,
      employeeId: b.employeeId,
      employeeName: b.employeeName,
      employeeCode: b.employeeCode,
      employeeEmail: b.employeeEmail,
      departmentName: b.departmentName ?? null,
      amount: b.amount,
      currency: b.currency,
      bonusType: b.bonusType,
      reason: b.reason,
      periodMonth: b.periodMonth ? String(b.periodMonth) : null,
      status: b.status,
      awardedBy: b.awardedBy,
      awardedByName: b.awardedBy,
      approvedBy: b.approvedBy ?? null,
      approvedByName: b.approvedBy ?? null,
      approvedAt: b.approvedAt ? new Date(b.approvedAt).toISOString() : null,
      rejectionReason: b.rejectionReason ?? null,
      payoutDate: b.payoutDate ? String(b.payoutDate) : null,
      linkedReviewId: b.linkedReviewId ?? null,
      createdAt: new Date(b.createdAt).toISOString(),
      updatedAt: new Date(b.updatedAt).toISOString(),
    }));
  },

  /**
   * Master listing with filters and aggregations
   */
  async list(
    actor: SessionUser,
    filters: {
      status?: string;
      bonusType?: string;
      departmentId?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{
    data: PaginatedResult<BonusRow>;
    summary: { totalApprovedAmount: string; totalPendingAmount: string };
  }> {
    const {
      status,
      bonusType,
      departmentId,
      search,
      page = 1,
      pageSize = 25,
    } = filters;

    const conditions = [isNull(bonuses.deletedAt)];

    if (actor.role === "USER") {
      conditions.push(eq(bonuses.employeeId, actor.id));
      conditions.push(sql`${bonuses.status} IN ('APPROVED', 'PAID')`);
    } else if (actor.role === "LEAD") {
      if (actor.departmentId) {
        conditions.push(
          or(
            eq(users.departmentId, actor.departmentId),
            eq(users.managerId, actor.id),
            eq(bonuses.employeeId, actor.id)
          )!
        );
      }
    }

    if (status) conditions.push(eq(bonuses.status, status as BonusStatus));
    if (bonusType) conditions.push(eq(bonuses.bonusType, bonusType as BonusType));
    if (departmentId) conditions.push(eq(users.departmentId, departmentId));

    if (search && search.trim() !== "") {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          sql`${users.fullName} ILIKE ${term}`,
          sql`${users.employeeCode} ILIKE ${term}`,
          sql`${bonuses.reason} ILIKE ${term}`
        )!
      );
    }

    const whereClause = and(...conditions) as SQL;

    // Summary sums
    const sumApprovedRes = await db
      .select({
        total: sql<string>`COALESCE(SUM(CASE WHEN ${bonuses.status} IN ('APPROVED', 'PAID') THEN ${bonuses.amount} ELSE 0 END), 0)::text`,
        pending: sql<string>`COALESCE(SUM(CASE WHEN ${bonuses.status} = 'PENDING_APPROVAL' THEN ${bonuses.amount} ELSE 0 END), 0)::text`,
      })
      .from(bonuses)
      .innerJoin(users, eq(bonuses.employeeId, users.id))
      .where(whereClause);

    const countRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bonuses)
      .innerJoin(users, eq(bonuses.employeeId, users.id))
      .where(whereClause);

    const total = countRes[0]?.count ?? 0;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    const rawRows = await db
      .select({
        id: bonuses.id,
        employeeId: bonuses.employeeId,
        employeeName: users.fullName,
        employeeCode: users.employeeCode,
        employeeEmail: users.email,
        departmentName: departments.name,
        amount: bonuses.amount,
        currency: bonuses.currency,
        bonusType: bonuses.bonusType,
        reason: bonuses.reason,
        periodMonth: bonuses.periodMonth,
        status: bonuses.status,
        awardedBy: bonuses.awardedBy,
        approvedBy: bonuses.approvedBy,
        approvedAt: bonuses.approvedAt,
        rejectionReason: bonuses.rejectionReason,
        payoutDate: bonuses.payoutDate,
        linkedReviewId: bonuses.linkedReviewId,
        createdAt: bonuses.createdAt,
        updatedAt: bonuses.updatedAt,
      })
      .from(bonuses)
      .innerJoin(users, eq(bonuses.employeeId, users.id))
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .where(whereClause)
      .orderBy(desc(bonuses.createdAt))
      .limit(pageSize)
      .offset(offset);

    const rows: BonusRow[] = rawRows.map((b) => ({
      id: b.id,
      employeeId: b.employeeId,
      employeeName: b.employeeName,
      employeeCode: b.employeeCode,
      employeeEmail: b.employeeEmail,
      departmentName: b.departmentName ?? null,
      amount: b.amount,
      currency: b.currency,
      bonusType: b.bonusType,
      reason: b.reason,
      periodMonth: b.periodMonth ? String(b.periodMonth) : null,
      status: b.status,
      awardedBy: b.awardedBy,
      awardedByName: b.awardedBy,
      approvedBy: b.approvedBy ?? null,
      approvedByName: b.approvedBy ?? null,
      approvedAt: b.approvedAt ? new Date(b.approvedAt).toISOString() : null,
      rejectionReason: b.rejectionReason ?? null,
      payoutDate: b.payoutDate ? String(b.payoutDate) : null,
      linkedReviewId: b.linkedReviewId ?? null,
      createdAt: new Date(b.createdAt).toISOString(),
      updatedAt: new Date(b.updatedAt).toISOString(),
    }));

    return {
      data: {
        rows,
        total,
        page,
        pageSize,
        totalPages,
      },
      summary: {
        totalApprovedAmount: sumApprovedRes[0]?.total ?? "0.00",
        totalPendingAmount: sumApprovedRes[0]?.pending ?? "0.00",
      },
    };
  },
};
