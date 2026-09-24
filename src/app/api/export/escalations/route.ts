import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { escalationRepo } from "@/server/repos/escalation.repo";
import { withAudit } from "@/lib/audit";
import type { SessionUser } from "@/types";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const severity = searchParams.get("severity") || undefined;
  const category = searchParams.get("category") || undefined;
  const origin = searchParams.get("origin") || undefined;
  const search = searchParams.get("search") || undefined;

  const data = await escalationRepo.list(user, {
    status,
    severity,
    category,
    origin,
    search,
    pageSize: 5000,
  });

  const headers = [
    "Ref Code",
    "Origin",
    "Raised By",
    "Subject Employee",
    "Assigned To",
    "Category",
    "Severity",
    "Title",
    "Description",
    "Status",
    "Resolution",
    "SLA Breached",
    "Due At",
    "Created At",
    "Resolved At",
  ];

  const rows = data.rows.map((e) => [
    e.refCode,
    e.origin,
    e.raisedByName,
    e.subjectEmployeeName || "N/A",
    e.assignedToName || "Unassigned",
    e.category,
    e.severity,
    e.title,
    e.description,
    e.status,
    e.resolution,
    e.slaBreached ? "YES" : "NO",
    e.dueAt,
    e.createdAt,
    e.resolvedAt,
  ]);

  const { formatCsv } = await import("@/lib/csv");
  const csvContent = formatCsv(headers, rows);

  // Log export in audit log
  await withAudit(
    { actor: user },
    {
      action: "EXPORT",
      entityType: "escalations",
      entityId: null,
      entityLabel: `Escalations CSV Export (${data.rows.length} rows)`,
      after: {
        filters: { status, severity, category, origin, search },
        rowCount: data.rows.length,
      },
    },
    async () => {
      return null;
    }
  );

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="escalations-export-${Date.now()}.csv"`,
    },
  });
}
