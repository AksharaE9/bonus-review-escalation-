import React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";
import { employeeProfileRepo } from "@/server/repos/employee-profile.repo";
import { bonusRepo } from "@/server/repos/bonus.repo";
import { reviewRepo } from "@/server/repos/review.repo";
import { escalationRepo } from "@/server/repos/escalation.repo";
import { formatINR } from "@/lib/money";
import { formatDateOnly } from "@/lib/dates";
import { ScorecardPrintButton } from "./ScorecardPrintButton";

interface ScorecardPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}

export default async function ScorecardPage({
  params,
  searchParams,
}: ScorecardPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const actor = session.user as unknown as SessionUser;
  const { id: employeeId } = await params;
  const { print } = await searchParams;

  const profileSummary = await employeeProfileRepo.getProfileHeaderAndStats(
    actor,
    employeeId
  );

  if (!profileSummary) {
    notFound();
  }

  const bonusesList = await bonusRepo.listForEmployee(actor, employeeId);
  const reviewsList = await reviewRepo.listForEmployee(actor, employeeId);
  const escalationsList = await escalationRepo.listForEmployee(actor, employeeId);

  const { employee, stats } = profileSummary;
  const latestReview = reviewsList[0] || null;

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-black print:p-0 print:max-w-none">
      {/* Top action bar (hidden during print) */}
      <div className="mb-6 flex items-center justify-between border-b pb-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold">Employee Scorecard</h2>
          <p className="text-xs text-gray-500">Official Operations & Performance Summary</p>
        </div>
        <ScorecardPrintButton autoPrint={print === "1"} />
      </div>

      {/* Header */}
      <div className="border-b-2 border-gray-900 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black tracking-tight">{employee.fullName}</h1>
            <p className="text-sm font-semibold text-gray-700">{employee.designation} · {employee.departmentName}</p>
          </div>
          <div className="text-right font-mono text-xs text-gray-600">
            <div>Code: <strong>{employee.employeeCode}</strong></div>
            <div>Joined: {employee.dateOfJoining ? formatDateOnly(employee.dateOfJoining) : "—"}</div>
          </div>
        </div>
      </div>

      {/* KPI Stat Grid */}
      <div className="my-6 grid grid-cols-4 gap-4 border border-gray-300 p-4 rounded text-center">
        <div>
          <div className="text-xs text-gray-500 uppercase font-semibold">Total Bonus (YTD)</div>
          <div className="text-lg font-bold font-mono">{formatINR(stats.totalBonusApprovedYtd)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase font-semibold">Bonuses Awarded</div>
          <div className="text-lg font-bold">{stats.totalBonusCount}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase font-semibold">Latest Rating</div>
          <div className="text-lg font-bold">{stats.latestReviewRating ? `${stats.latestReviewRating} / 5.0` : "—"}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase font-semibold">Open Escalations</div>
          <div className="text-lg font-bold">{stats.openEscalationsCount}</div>
        </div>
      </div>

      {/* Latest Performance Review Summary */}
      {latestReview && (
        <div className="my-6 border-t pt-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-2">
            Latest Performance Evaluation ({latestReview.reviewType})
          </h3>
          <p className="text-xs text-gray-700 leading-relaxed mb-3">
            {latestReview.summary}
          </p>
          {latestReview.ratings && latestReview.ratings.length > 0 && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {latestReview.ratings.map((r) => (
                <div key={r.competencyId} className="flex justify-between border-b pb-1">
                  <span className="text-gray-600">{r.competencyName}:</span>
                  <span className="font-bold">{r.score} / 5.0</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bonus History Summary */}
      <div className="my-6 border-t pt-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-2">
          Bonus Payout History
        </h3>
        {bonusesList.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No bonus records.</p>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="border-b font-semibold text-gray-600">
              <tr>
                <th className="py-1">Date</th>
                <th className="py-1">Type</th>
                <th className="py-1">Amount</th>
                <th className="py-1">Status</th>
                <th className="py-1">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bonusesList.slice(0, 5).map((b) => (
                <tr key={b.id}>
                  <td className="py-1 text-gray-600">{formatDateOnly(b.createdAt)}</td>
                  <td className="py-1">{b.bonusType}</td>
                  <td className="py-1 font-bold font-mono">{formatINR(b.amount)}</td>
                  <td className="py-1">{b.status}</td>
                  <td className="py-1 text-gray-700 max-w-xs truncate">{b.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Escalation History */}
      <div className="my-6 border-t pt-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-2">
          Operational & Escalation History
        </h3>
        {escalationsList.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No escalations on record.</p>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="border-b font-semibold text-gray-600">
              <tr>
                <th className="py-1">Ref</th>
                <th className="py-1">Category</th>
                <th className="py-1">Severity</th>
                <th className="py-1">Status</th>
                <th className="py-1">Title</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {escalationsList.slice(0, 4).map((e) => (
                <tr key={e.id}>
                  <td className="py-1 font-mono">{e.refCode}</td>
                  <td className="py-1">{e.category}</td>
                  <td className="py-1">{e.severity}</td>
                  <td className="py-1">{e.status}</td>
                  <td className="py-1 text-gray-700">{e.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 border-t pt-3 text-[10px] text-gray-400 flex justify-between">
        <span>Pulse People Operations Console · Internal & Confidential</span>
        <span>Generated on {formatDateOnly(new Date())}</span>
      </div>
    </div>
  );
}
