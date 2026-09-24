import "server-only";
import { desc, lt, and, eq, gte, lte, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema/audit";
import { users } from "@/db/schema/users";
import type { SessionUser, AuditAction } from "@/types";
import { can } from "@/lib/rbac";

export interface ListAuditFilters {
  cursorId?: number;
  action?: AuditAction;
  entityType?: string;
  actorId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
}

export interface AuditLogRow {
  id: number;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  actorName: string | null;
  actorAvatarUrl: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  changedFields: string[] | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: string;
}

export const auditRepo = {
  /**
   * List audit logs with cursor pagination (ADMIN only)
   */
  async list(
    actor: SessionUser,
    filters: ListAuditFilters = {}
  ): Promise<{ rows: AuditLogRow[]; nextCursor: number | null; total: number }> {
    if (!can(actor, "view_audit_log")) {
      throw new Error("UNAUTHORIZED: Audit log access is restricted to Administrators.");
    }

    const {
      cursorId,
      action,
      entityType,
      actorId,
      startDate,
      endDate,
      search,
      limit = 50,
    } = filters;

    const conditions = [];

    if (cursorId) {
      conditions.push(lt(auditLogs.id, cursorId));
    }

    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }

    if (entityType) {
      conditions.push(eq(auditLogs.entityType, entityType));
    }

    if (actorId) {
      conditions.push(eq(auditLogs.actorId, actorId));
    }

    if (startDate) {
      conditions.push(gte(auditLogs.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(auditLogs.createdAt, new Date(endDate)));
    }

    if (search && search.trim() !== "") {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(auditLogs.entityLabel, term),
          ilike(auditLogs.entityId, term),
          ilike(auditLogs.actorEmail, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total count
    const countRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(whereClause);
    const total = countRes[0]?.count ?? 0;

    // Fetch limit + 1 to detect next page cursor
    const rawRows = await db
      .select({
        id: auditLogs.id,
        actorId: auditLogs.actorId,
        actorEmail: auditLogs.actorEmail,
        actorRole: auditLogs.actorRole,
        actorName: users.fullName,
        actorAvatarUrl: users.avatarUrl,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        entityLabel: auditLogs.entityLabel,
        before: auditLogs.before,
        after: auditLogs.after,
        changedFields: auditLogs.changedFields,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        requestId: auditLogs.requestId,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.id))
      .limit(limit + 1);

    let nextCursor: number | null = null;
    let rows = rawRows;

    if (rawRows.length > limit) {
      const nextItem = rawRows[limit];
      nextCursor = nextItem.id;
      rows = rawRows.slice(0, limit);
    }

    return {
      rows: rows.map((r) => ({
        ...r,
        action: r.action as AuditAction,
        before: r.before as Record<string, unknown> | null,
        after: r.after as Record<string, unknown> | null,
        createdAt: new Date(r.createdAt).toISOString(),
      })),
      nextCursor,
      total,
    };
  },

  /**
   * Get scoped audit trail for a specific entity or employee (for Profile Audit tab)
   */
  async listForEntity(
    actor: SessionUser,
    entityType: string,
    entityId: string
  ): Promise<AuditLogRow[]> {
    if (!can(actor, "view_audit_log")) {
      return [];
    }

    const rows = await db
      .select({
        id: auditLogs.id,
        actorId: auditLogs.actorId,
        actorEmail: auditLogs.actorEmail,
        actorRole: auditLogs.actorRole,
        actorName: users.fullName,
        actorAvatarUrl: users.avatarUrl,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        entityLabel: auditLogs.entityLabel,
        before: auditLogs.before,
        after: auditLogs.after,
        changedFields: auditLogs.changedFields,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        requestId: auditLogs.requestId,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .where(
        and(
          eq(auditLogs.entityType, entityType),
          eq(auditLogs.entityId, entityId)
        )
      )
      .orderBy(desc(auditLogs.id))
      .limit(100);

    return rows.map((r) => ({
      ...r,
      action: r.action as AuditAction,
      before: r.before as Record<string, unknown> | null,
      after: r.after as Record<string, unknown> | null,
      createdAt: new Date(r.createdAt).toISOString(),
    }));
  },
};
