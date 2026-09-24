import "server-only";
import { SQL, eq, and, isNull, desc, sql, or } from "drizzle-orm";
import { db } from "@/db";
import { escalations, escalationComments } from "@/db/schema/escalations";
import { users } from "@/db/schema/users";
import type {
  SessionUser,
  EscalationStatus,
  EscalationSeverity,
  EscalationCategory,
  EscalationOrigin,
  PaginatedResult,
} from "@/types";
import { can } from "@/lib/rbac";

export interface EscalationCommentRow {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatarUrl: string | null;
  body: string;
  visibility: "INTERNAL" | "SHARED";
  isStatusChange: boolean;
  createdAt: string;
}

export interface EscalationRow {
  id: string;
  refCode: string;
  origin: EscalationOrigin;
  raisedBy: string;
  raisedByName: string;
  raisedByEmail: string | null;
  subjectEmployeeId: string | null;
  subjectEmployeeName: string | null;
  subjectEmployeeCode: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  category: EscalationCategory;
  severity: EscalationSeverity;
  title: string;
  description: string;
  status: EscalationStatus;
  resolution: string | null;
  isConfidential: boolean;
  isAnonymous: boolean;
  dueAt: string | null;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  slaBreached: boolean;
  createdAt: string;
  updatedAt: string;
  comments?: EscalationCommentRow[];
}

export const escalationRepo = {
  /**
   * List escalations concerning a specific employee (used on Profile page Escalations tab)
   */
  async listForEmployee(
    actor: SessionUser,
    employeeId: string
  ): Promise<EscalationRow[]> {
    const isSelf = actor.id === employeeId;

    if (!isSelf && !can(actor, "view_employee_profile")) {
      return [];
    }

    const conditions = [
      eq(escalations.subjectEmployeeId, employeeId),
      isNull(escalations.deletedAt),
    ];

    if (actor.role === "LEAD") {
      conditions.push(eq(escalations.isConfidential, false));
    }

    const rawRows = await db
      .select({
        id: escalations.id,
        refCode: escalations.refCode,
        origin: escalations.origin,
        raisedBy: escalations.raisedBy,
        raisedByName: users.fullName,
        raisedByEmail: users.email,
        assignedTo: escalations.assignedTo,
        category: escalations.category,
        severity: escalations.severity,
        title: escalations.title,
        description: escalations.description,
        status: escalations.status,
        resolution: escalations.resolution,
        isConfidential: escalations.isConfidential,
        isAnonymous: escalations.isAnonymous,
        dueAt: escalations.dueAt,
        firstResponseAt: escalations.firstResponseAt,
        resolvedAt: escalations.resolvedAt,
        closedAt: escalations.closedAt,
        createdAt: escalations.createdAt,
        updatedAt: escalations.updatedAt,
      })
      .from(escalations)
      .leftJoin(users, eq(escalations.raisedBy, users.id))
      .where(and(...conditions)!)
      .orderBy(desc(escalations.createdAt));

    const now = new Date();

    return rawRows.map((e) => {
      const isBreached = Boolean(
        e.dueAt &&
          new Date(e.dueAt) < now &&
          !["RESOLVED", "CLOSED", "WITHDRAWN"].includes(e.status)
      );

      // Mask anonymous creator for non-admins
      const isAnonymousHidden = e.isAnonymous && actor.role !== "ADMIN";

      return {
        id: e.id,
        refCode: e.refCode,
        origin: e.origin,
        raisedBy: isAnonymousHidden ? "anonymous" : e.raisedBy,
        raisedByName: isAnonymousHidden ? "Anonymous Employee" : (e.raisedByName || "Unknown"),
        raisedByEmail: isAnonymousHidden ? null : e.raisedByEmail,
        subjectEmployeeId: employeeId,
        subjectEmployeeName: null,
        subjectEmployeeCode: null,
        assignedTo: e.assignedTo,
        assignedToName: e.assignedTo,
        category: e.category,
        severity: e.severity,
        title: e.title,
        description: e.description,
        status: e.status,
        resolution: e.resolution,
        isConfidential: e.isConfidential,
        isAnonymous: e.isAnonymous,
        dueAt: e.dueAt ? new Date(e.dueAt).toISOString() : null,
        firstResponseAt: e.firstResponseAt ? new Date(e.firstResponseAt).toISOString() : null,
        resolvedAt: e.resolvedAt ? new Date(e.resolvedAt).toISOString() : null,
        closedAt: e.closedAt ? new Date(e.closedAt).toISOString() : null,
        slaBreached: isBreached,
        createdAt: new Date(e.createdAt).toISOString(),
        updatedAt: new Date(e.updatedAt).toISOString(),
      };
    });
  },

  /**
   * Find escalation by Ref Code with threaded comments and strict visibility filtering
   */
  async findByRefCode(
    actor: SessionUser,
    refCode: string
  ): Promise<EscalationRow | null> {
    const raw = await db
      .select({
        id: escalations.id,
        refCode: escalations.refCode,
        origin: escalations.origin,
        raisedBy: escalations.raisedBy,
        raisedByName: users.fullName,
        raisedByEmail: users.email,
        subjectEmployeeId: escalations.subjectEmployeeId,
        assignedTo: escalations.assignedTo,
        category: escalations.category,
        severity: escalations.severity,
        title: escalations.title,
        description: escalations.description,
        status: escalations.status,
        resolution: escalations.resolution,
        isConfidential: escalations.isConfidential,
        isAnonymous: escalations.isAnonymous,
        dueAt: escalations.dueAt,
        firstResponseAt: escalations.firstResponseAt,
        resolvedAt: escalations.resolvedAt,
        closedAt: escalations.closedAt,
        createdAt: escalations.createdAt,
        updatedAt: escalations.updatedAt,
      })
      .from(escalations)
      .leftJoin(users, eq(escalations.raisedBy, users.id))
      .where(and(eq(escalations.refCode, refCode), isNull(escalations.deletedAt)))
      .limit(1);

    if (!raw || raw.length === 0) return null;
    const e = raw[0];

    const isRaiser = actor.id === e.raisedBy;
    const isSubject = actor.id === e.subjectEmployeeId;

    // Confidentiality check
    if (e.isConfidential && actor.role !== "ADMIN" && !isRaiser) {
      return null; // 404
    }

    // Role boundary checks for regular user
    if (actor.role === "USER" && !isRaiser && !isSubject) {
      return null;
    }

    // Fetch comments
    const commentConditions = [eq(escalationComments.escalationId, e.id)];
    if (actor.role === "USER") {
      // Employee sees ONLY SHARED comments (zero leakage of INTERNAL comments in network payload)
      commentConditions.push(eq(escalationComments.visibility, "SHARED"));
    }

    const commentsRaw = await db
      .select({
        id: escalationComments.id,
        authorId: escalationComments.authorId,
        authorName: users.fullName,
        authorRole: users.role,
        authorAvatarUrl: users.avatarUrl,
        body: escalationComments.body,
        visibility: escalationComments.visibility,
        isStatusChange: escalationComments.isStatusChange,
        createdAt: escalationComments.createdAt,
      })
      .from(escalationComments)
      .innerJoin(users, eq(escalationComments.authorId, users.id))
      .where(and(...commentConditions))
      .orderBy(sql`${escalationComments.createdAt} ASC`);

    const now = new Date();
    const isBreached = Boolean(
      e.dueAt &&
        new Date(e.dueAt) < now &&
        !["RESOLVED", "CLOSED", "WITHDRAWN"].includes(e.status)
    );

    const isAnonymousHidden = e.isAnonymous && actor.role !== "ADMIN";

    return {
      id: e.id,
      refCode: e.refCode,
      origin: e.origin,
      raisedBy: isAnonymousHidden ? "anonymous" : e.raisedBy,
      raisedByName: isAnonymousHidden ? "Anonymous Employee" : (e.raisedByName || "Unknown"),
      raisedByEmail: isAnonymousHidden ? null : e.raisedByEmail,
      subjectEmployeeId: e.subjectEmployeeId,
      subjectEmployeeName: null,
      subjectEmployeeCode: null,
      assignedTo: e.assignedTo,
      assignedToName: e.assignedTo,
      category: e.category,
      severity: e.severity,
      title: e.title,
      description: e.description,
      status: e.status,
      resolution: e.resolution,
      isConfidential: e.isConfidential,
      isAnonymous: e.isAnonymous,
      dueAt: e.dueAt ? new Date(e.dueAt).toISOString() : null,
      firstResponseAt: e.firstResponseAt ? new Date(e.firstResponseAt).toISOString() : null,
      resolvedAt: e.resolvedAt ? new Date(e.resolvedAt).toISOString() : null,
      closedAt: e.closedAt ? new Date(e.closedAt).toISOString() : null,
      slaBreached: isBreached,
      createdAt: new Date(e.createdAt).toISOString(),
      updatedAt: new Date(e.updatedAt).toISOString(),
      comments: commentsRaw.map((c) => ({
        id: c.id,
        authorId: c.authorId,
        authorName: c.authorName,
        authorRole: c.authorRole,
        authorAvatarUrl: c.authorAvatarUrl,
        body: c.body,
        visibility: c.visibility,
        isStatusChange: c.isStatusChange,
        createdAt: new Date(c.createdAt).toISOString(),
      })),
    };
  },

  /**
   * Master escalations list with filters
   */
  async list(
    actor: SessionUser,
    filters: {
      status?: string;
      severity?: string;
      category?: string;
      origin?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<PaginatedResult<EscalationRow>> {
    const {
      status,
      severity,
      category,
      origin,
      search,
      page = 1,
      pageSize = 25,
    } = filters;

    const conditions = [isNull(escalations.deletedAt)];

    if (actor.role === "USER") {
      conditions.push(
        or(
          eq(escalations.raisedBy, actor.id),
          eq(escalations.subjectEmployeeId, actor.id)
        )!
      );
    } else if (actor.role === "LEAD") {
      conditions.push(eq(escalations.isConfidential, false));
    }

    if (status) conditions.push(eq(escalations.status, status as EscalationStatus));
    if (severity) conditions.push(eq(escalations.severity, severity as EscalationSeverity));
    if (category) conditions.push(eq(escalations.category, category as EscalationCategory));
    if (origin) conditions.push(eq(escalations.origin, origin as EscalationOrigin));

    if (search && search.trim() !== "") {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          sql`${escalations.refCode} ILIKE ${term}`,
          sql`${escalations.title} ILIKE ${term}`,
          sql`${escalations.description} ILIKE ${term}`
        )!
      );
    }

    const whereClause = and(...conditions) as SQL;

    const countRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(escalations)
      .where(whereClause);

    const total = countRes[0]?.count ?? 0;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    const rawRows = await db
      .select({
        id: escalations.id,
        refCode: escalations.refCode,
        origin: escalations.origin,
        raisedBy: escalations.raisedBy,
        raisedByName: users.fullName,
        raisedByEmail: users.email,
        subjectEmployeeId: escalations.subjectEmployeeId,
        assignedTo: escalations.assignedTo,
        category: escalations.category,
        severity: escalations.severity,
        title: escalations.title,
        description: escalations.description,
        status: escalations.status,
        resolution: escalations.resolution,
        isConfidential: escalations.isConfidential,
        isAnonymous: escalations.isAnonymous,
        dueAt: escalations.dueAt,
        firstResponseAt: escalations.firstResponseAt,
        resolvedAt: escalations.resolvedAt,
        closedAt: escalations.closedAt,
        createdAt: escalations.createdAt,
        updatedAt: escalations.updatedAt,
      })
      .from(escalations)
      .leftJoin(users, eq(escalations.raisedBy, users.id))
      .where(whereClause)
      .orderBy(desc(escalations.createdAt))
      .limit(pageSize)
      .offset(offset);

    const now = new Date();

    const rows: EscalationRow[] = rawRows.map((e) => {
      const isBreached = Boolean(
        e.dueAt &&
          new Date(e.dueAt) < now &&
          !["RESOLVED", "CLOSED", "WITHDRAWN"].includes(e.status)
      );

      const isAnonymousHidden = e.isAnonymous && actor.role !== "ADMIN";

      return {
        id: e.id,
        refCode: e.refCode,
        origin: e.origin,
        raisedBy: isAnonymousHidden ? "anonymous" : e.raisedBy,
        raisedByName: isAnonymousHidden ? "Anonymous Employee" : (e.raisedByName || "Unknown"),
        raisedByEmail: isAnonymousHidden ? null : e.raisedByEmail,
        subjectEmployeeId: e.subjectEmployeeId,
        subjectEmployeeName: null,
        subjectEmployeeCode: null,
        assignedTo: e.assignedTo,
        assignedToName: e.assignedTo,
        category: e.category,
        severity: e.severity,
        title: e.title,
        description: e.description,
        status: e.status,
        resolution: e.resolution,
        isConfidential: e.isConfidential,
        isAnonymous: e.isAnonymous,
        dueAt: e.dueAt ? new Date(e.dueAt).toISOString() : null,
        firstResponseAt: e.firstResponseAt ? new Date(e.firstResponseAt).toISOString() : null,
        resolvedAt: e.resolvedAt ? new Date(e.resolvedAt).toISOString() : null,
        closedAt: e.closedAt ? new Date(e.closedAt).toISOString() : null,
        slaBreached: isBreached,
        createdAt: new Date(e.createdAt).toISOString(),
        updatedAt: new Date(e.updatedAt).toISOString(),
      };
    });

    return {
      rows,
      total,
      page,
      pageSize,
      totalPages,
    };
  },
};
