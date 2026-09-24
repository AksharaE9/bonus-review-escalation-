import "server-only";
import { txDb } from "@/db";
import { auditLogs } from "@/db/schema/audit";
import type { AuditAction, Role, SessionUser } from "@/types";

export interface AuditContext {
  actor: SessionUser | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
}

export interface AuditLogEntry {
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

/**
 * Calculates keys that differ between before and after records
 */
export function computeChangedFields(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined
): string[] {
  if (!before && !after) return [];
  if (!before && after) return Object.keys(after);
  if (before && !after) return Object.keys(before);

  const keys = new Set([...Object.keys(before!), ...Object.keys(after!)]);
  const changed: string[] = [];

  for (const key of keys) {
    const v1 = before![key];
    const v2 = after![key];

    // Standardize comparison for dates and objects
    const s1 = typeof v1 === "object" ? JSON.stringify(v1) : String(v1);
    const s2 = typeof v2 === "object" ? JSON.stringify(v2) : String(v2);

    if (s1 !== s2) {
      changed.push(key);
    }
  }

  return changed;
}

const SENSITIVE_FIELDS = new Set([
  "passwordHash",
  "password_hash",
  "password",
  "token",
  "resetToken",
  "authSecret",
  "secret",
]);

export function sanitizeAuditPayload(
  record: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!record) return null;
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (SENSITIVE_FIELDS.has(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      sanitized[key] = sanitizeAuditPayload(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Executes a mutation and appends an immutable audit log row within the same atomic database transaction.
 * If either the mutation or the audit log write fails, the entire transaction rolls back cleanly.
 */
export async function withAudit<T>(
  auditContext: AuditContext,
  auditEntry: AuditLogEntry | ((mutationResult: T) => AuditLogEntry),
  mutationFn: (tx: Parameters<Parameters<typeof txDb.transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  return await txDb.transaction(async (tx) => {
    // 1. Execute parent mutation
    const result = await mutationFn(tx);

    // 2. Resolve audit payload (can dynamically use mutation result)
    const entry = typeof auditEntry === "function" ? auditEntry(result) : auditEntry;

    const sanitizedBefore = sanitizeAuditPayload(entry.before);
    const sanitizedAfter = sanitizeAuditPayload(entry.after);

    // 3. Compute changed fields
    const changedFields = computeChangedFields(sanitizedBefore, sanitizedAfter);

    // 4. Write audit record inside the same transaction
    await tx.insert(auditLogs).values({
      actorId: auditContext.actor?.id ?? null,
      actorEmail: auditContext.actor?.email ?? null,
      actorRole: (auditContext.actor?.role as Role) ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      entityLabel: entry.entityLabel,
      before: sanitizedBefore,
      after: sanitizedAfter,
      changedFields: changedFields.length > 0 ? changedFields : null,
      ipAddress: auditContext.ipAddress ?? null,
      userAgent: auditContext.userAgent ?? null,
      requestId: auditContext.requestId ? auditContext.requestId : null,
      createdAt: new Date(),
    });

    return result;
  });
}
