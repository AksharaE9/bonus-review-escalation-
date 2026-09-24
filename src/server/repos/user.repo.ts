import "server-only";
import { eq, and, isNull, asc, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { departments } from "@/db/schema/departments";
import type { SessionUser, PublicUser, PaginatedResult, Role, UserStatus } from "@/types";
import { can } from "@/lib/rbac";

export interface ListUsersFilters {
  search?: string;
  departmentId?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  includeDeleted?: boolean;
}

export interface UserRowInput {
  id: string;
  employeeCode: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: Role;
  departmentId?: string | null;
  departmentName?: string | null;
  departmentCode?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  designation?: string | null;
  dateOfJoining?: string | Date | null;
  phone?: string | null;
  status: UserStatus;
  mustChangePassword?: boolean;
  lastLoginAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
}

export function toPublicUser(row: UserRowInput): PublicUser {
  return {
    id: row.id,
    employeeCode: row.employeeCode,
    email: row.email,
    fullName: row.fullName,
    avatarUrl: row.avatarUrl ?? null,
    role: row.role,
    departmentId: row.departmentId ?? null,
    departmentName: row.departmentName ?? null,
    departmentCode: row.departmentCode ?? null,
    managerId: row.managerId ?? null,
    managerName: row.managerName ?? null,
    designation: row.designation ?? null,
    dateOfJoining: row.dateOfJoining ? String(row.dateOfJoining) : null,
    phone: row.phone ?? null,
    status: row.status,
    mustChangePassword: Boolean(row.mustChangePassword),
    lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt).toISOString() : null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt || row.createdAt).toISOString(),
    deletedAt: row.deletedAt ? new Date(row.deletedAt).toISOString() : null,
  };
}

export const userRepo = {
  /**
   * Find user by ID with strict actor scoping
   */
  async findById(
    actor: SessionUser,
    userId: string
  ): Promise<PublicUser | null> {
    const isSelf = actor.id === userId;

    if (!isSelf && !can(actor, "view_employee_profile")) {
      return null;
    }

    const query = db
      .select({
        id: users.id,
        employeeCode: users.employeeCode,
        email: users.email,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        role: users.role,
        departmentId: users.departmentId,
        departmentName: departments.name,
        departmentCode: departments.code,
        managerId: users.managerId,
        designation: users.designation,
        dateOfJoining: users.dateOfJoining,
        phone: users.phone,
        status: users.status,
        mustChangePassword: users.mustChangePassword,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        deletedAt: users.deletedAt,
      })
      .from(users)
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .where(
        and(
          eq(users.id, userId),
          actor.role === "ADMIN" ? undefined : isNull(users.deletedAt)
        )
      )
      .limit(1);

    const rows = await query;
    if (!rows || rows.length === 0) return null;

    const target = rows[0];

    // Check LEAD scoping
    if (actor.role === "LEAD" && !isSelf) {
      const allowed = can(actor, "view_employee_profile", {
        targetUserId: target.id,
        targetDepartmentId: target.departmentId,
        targetManagerId: target.managerId,
      });
      if (!allowed) return null;
    }

    return toPublicUser(target);
  },

  /**
   * List users with pagination and search
   */
  async list(
    actor: SessionUser,
    filters: ListUsersFilters = {}
  ): Promise<PaginatedResult<PublicUser>> {
    const {
      search,
      departmentId,
      role,
      status,
      page = 1,
      pageSize = 25,
      includeDeleted = false,
    } = filters;

    // Role-based visibility scoping
    if (actor.role === "USER") {
      return { rows: [], total: 0, page, pageSize, totalPages: 0 };
    }

    const conditions = [];

    if (!includeDeleted) {
      conditions.push(isNull(users.deletedAt));
    }

    if (actor.role === "LEAD") {
      // Lead only sees members of their department or direct reports
      if (actor.departmentId) {
        conditions.push(
          or(
            eq(users.departmentId, actor.departmentId),
            eq(users.managerId, actor.id),
            eq(users.id, actor.id)
          )
        );
      } else {
        conditions.push(
          or(eq(users.managerId, actor.id), eq(users.id, actor.id))
        );
      }
    } else if (departmentId) {
      conditions.push(eq(users.departmentId, departmentId));
    }

    if (role) {
      conditions.push(eq(users.role, role as Role));
    }

    if (status) {
      conditions.push(eq(users.status, status as UserStatus));
    }

    if (search && search.trim() !== "") {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(users.fullName, term),
          ilike(users.employeeCode, term),
          ilike(users.email, term),
          ilike(users.designation, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count query
    const countRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(whereClause);

    const total = countRes[0]?.count ?? 0;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    // Data query with explicit columns
    const rows = await db
      .select({
        id: users.id,
        employeeCode: users.employeeCode,
        email: users.email,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        role: users.role,
        departmentId: users.departmentId,
        departmentName: departments.name,
        departmentCode: departments.code,
        managerId: users.managerId,
        designation: users.designation,
        dateOfJoining: users.dateOfJoining,
        phone: users.phone,
        status: users.status,
        mustChangePassword: users.mustChangePassword,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        deletedAt: users.deletedAt,
      })
      .from(users)
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .where(whereClause)
      .orderBy(asc(users.fullName))
      .limit(pageSize)
      .offset(offset);

    return {
      rows: rows.map(toPublicUser),
      total,
      page,
      pageSize,
      totalPages,
    };
  },

  /**
   * List all active departments
   */
  async getDepartments(): Promise<{ id: string; name: string; code: string }[]> {
    return db
      .select({ id: departments.id, name: departments.name, code: departments.code })
      .from(departments)
      .where(eq(departments.isActive, true))
      .orderBy(asc(departments.name));
  },
};
