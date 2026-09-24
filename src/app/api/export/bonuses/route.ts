import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { bonusRepo } from "@/server/repos/bonus.repo";
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
  const bonusType = searchParams.get("bonusType") || undefined;
  const search = searchParams.get("search") || undefined;

  const data = await bonusRepo.list(user, {
    status,
    bonusType,
    search,
    pageSize: 5000,
  });

  const headers = [
    "ID",
    "Employee Code",
    "Employee Name",
    "Department",
    "Amount",
    "Currency",
    "Type",
    "Status",
    "Reason",
    "Period Month",
    "Awarded By",
    "Approved By",
    "Payout Date",
    "Created At",
  ];

  const rows = data.data.rows.map((b) => [
    b.id,
    b.employeeCode,
    b.employeeName,
    b.departmentName,
    b.amount,
    b.currency,
    b.bonusType,
    b.status,
    b.reason,
    b.periodMonth,
    b.awardedByName,
    b.approvedByName,
    b.payoutDate,
    b.createdAt,
  ]);

  const { formatCsv } = await import("@/lib/csv");
  const csvContent = formatCsv(headers, rows);

  // Record audit event
  await withAudit(
    {
      actor: user,
      ipAddress: request.headers.get("x-forwarded-for") || null,
      userAgent: request.headers.get("user-agent") || null,
      requestId: request.headers.get("x-request-id") || null,
    },
    {
      action: "EXPORT",
      entityType: "BONUS",
      entityId: null,
      entityLabel: `Exported ${data.data.rows.length} bonus records to CSV`,
      after: {
        filter: { status, bonusType, search },
        exported_count: data.data.rows.length,
      },
    },
    async () => true
  );

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pulse-bonuses-export-${Date.now()}.csv"`,
    },
  });
}
