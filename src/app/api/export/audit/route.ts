import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { auditRepo } from "@/server/repos/audit.repo";
import { withAudit } from "@/lib/audit";
import type { SessionUser } from "@/types";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser;

  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || undefined;
  const entityType = searchParams.get("entityType") || undefined;
  const search = searchParams.get("search") || undefined;

  const data = await auditRepo.list(user, {
    action: action as import("@/types").AuditAction,
    entityType,
    search,
    limit: 1000,
  });

  // 2. Format to CSV
  const headers = [
    "ID",
    "Timestamp",
    "Actor Email",
    "Actor Role",
    "Action",
    "Entity Type",
    "Entity ID",
    "Entity Label",
    "IP Address",
    "Changed Fields",
  ];

  const rows = data.rows.map((r) => [
    r.id,
    r.createdAt,
    r.actorEmail,
    r.actorRole,
    r.action,
    r.entityType,
    r.entityId,
    r.entityLabel,
    r.ipAddress,
    r.changedFields?.join(", "),
  ]);

  const { formatCsv } = await import("@/lib/csv");
  const csvContent = formatCsv(headers, rows);

  // 3. Write EXPORT audit record
  await withAudit(
    {
      actor: user,
      ipAddress: request.headers.get("x-forwarded-for") || null,
      userAgent: request.headers.get("user-agent") || null,
      requestId: request.headers.get("x-request-id") || null,
    },
    {
      action: "EXPORT",
      entityType: "AUDIT_LOG",
      entityId: null,
      entityLabel: `Exported ${data.rows.length} audit records to CSV`,
      after: {
        filter: { action, entityType, search },
        exported_count: data.rows.length,
      },
    },
    async () => {
      // no-op state mutation, audit row recorded
      return true;
    }
  );

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pulse-audit-export-${Date.now()}.csv"`,
    },
  });
}
