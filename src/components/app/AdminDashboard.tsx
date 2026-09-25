"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/types";
import { AdminDashboardData } from "@/server/repos/dashboard.repo";
import { StatTile } from "@/components/app/StatTile";
import { PageHeader } from "@/components/app/PageHeader";
import { SeverityBadge } from "@/components/app/SeverityBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatINR } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { approveBonusAction } from "@/server/actions/bonus";
import { toast } from "sonner";
import {
  Users,
  IndianRupee,
  Clock,
  ShieldAlert,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  Activity,
  Check,
  Shield,
} from "lucide-react";
import dynamic from "next/dynamic";

const BonusSpendChart = dynamic(
  () => import("@/components/app/AdminCharts").then((mod) => mod.BonusSpendChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground animate-pulse">
        Loading chart data...
      </div>
    ),
  }
);

const EscalationVelocityChart = dynamic(
  () => import("@/components/app/AdminCharts").then((mod) => mod.EscalationVelocityChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground animate-pulse">
        Loading velocity metrics...
      </div>
    ),
  }
);

interface AdminDashboardProps {
  user?: SessionUser;
  data: AdminDashboardData;
}

export function AdminDashboard({ data }: AdminDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleQuickApproveBonus = (bonusId: string) => {
    startTransition(async () => {
      try {
        const res = await approveBonusAction(bonusId);
        if (res.success) {
          toast.success("Bonus approved successfully");
          router.refresh();
        }
      } catch (err: unknown) {
        toast.error((err as Error).message || "Failed to approve bonus");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Executive Overview"
        description="Comprehensive telemetry across bonuses, performance cycles, escalations, and system audit."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/bonuses">
              <Button variant="outline" size="sm" className="text-xs h-8 bg-white hover:bg-slate-50 border-slate-200 text-slate-700">
                Bonus Registry
              </Button>
            </Link>
            <Link href="/audit">
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5 bg-white hover:bg-slate-50 border-slate-200 text-slate-700">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                Audit Logs
              </Button>
            </Link>
          </div>
        }
      />

      {/* 6 Metric Stat Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatTile
          label="Active Staff"
          value={data.stats.totalEmployees}
          icon={Users}
        />
        <StatTile
          label="FY Bonus Spend"
          value={formatINR(data.stats.fyBonusSpend)}
          icon={IndianRupee}
        />
        <StatTile
          label="Pending Approval"
          value={data.stats.pendingBonusesCount}
          icon={Clock}
        />
        <StatTile
          label="Open Escalations"
          value={data.stats.openEscalationsCount}
          icon={ShieldAlert}
        />
        <StatTile
          label="SLA Breached"
          value={data.stats.overdueEscalationsCount}
          icon={AlertTriangle}
        />
        <StatTile
          label="Active Reviews"
          value={data.stats.reviewsPendingCount}
          icon={FileCheck}
        />
      </div>

      {/* 2 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Bonus Spend Trend (12 Months Bar Chart) */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Monthly Bonus Spend
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Approved & paid bonuses across the last 12 calendar months
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[240px] w-full">
              <BonusSpendChart data={data.bonusSpendTrend} />
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Escalations Opened vs Resolved (12 Weeks Line Chart) */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                  <Activity className="w-4 h-4 text-sky-600" />
                  Escalation Resolution Velocity
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Opened vs resolved cases over 12 weeks
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[240px] w-full">
              <EscalationVelocityChart data={data.escalationTrend} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3 Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel 1: Awaiting Your Approval */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Awaiting Approval ({data.pendingBonuses.length})
            </CardTitle>
            <Link href="/bonuses?status=PENDING_APPROVAL" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="pt-3 divide-y divide-slate-100">
            {data.pendingBonuses.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                All bonus awards are up to date.
              </div>
            ) : (
              data.pendingBonuses.map((b) => (
                <div key={b.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-xs text-slate-900">
                        {b.employeeName}
                      </span>{" "}
                      <span className="text-[10px] text-slate-400 font-mono">({b.employeeCode})</span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-slate-900">
                      {formatINR(b.amount)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                    &ldquo;{b.reason}&rdquo;
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">
                      By {b.awardedByName} · {b.bonusType}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[10px] gap-1 bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                      onClick={() => handleQuickApproveBonus(b.id)}
                      disabled={isPending}
                    >
                      <Check className="w-3 h-3" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Panel 2: Critical & Overdue Escalations */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Critical & Overdue ({data.criticalEscalations.length})
            </CardTitle>
            <Link href="/escalations" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="pt-3 divide-y divide-slate-100">
            {data.criticalEscalations.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No critical or overdue escalations.
              </div>
            ) : (
              data.criticalEscalations.map((e) => (
                <Link
                  key={e.id}
                  href={`/escalations/${e.refCode}`}
                  className="block py-2.5 space-y-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-indigo-600 group-hover:underline">
                      {e.refCode}
                    </span>
                    <SeverityBadge severity={e.severity} />
                  </div>
                  <div className="text-xs font-medium text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {e.title}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>By {e.raisedByName}</span>
                    {e.slaBreached ? (
                      <span className="font-semibold text-rose-600">SLA Breached</span>
                    ) : (
                      <span>Status: {e.status}</span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Panel 3: Recent Audit Activity */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Audit Stream (Last 10)
            </CardTitle>
            <Link href="/audit" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
              Full log
            </Link>
          </CardHeader>
          <CardContent className="pt-3 space-y-2">
            {data.recentAuditLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No audit entries recorded.
              </div>
            ) : (
              data.recentAuditLogs.map((a) => (
                <div key={a.id} className="text-[11px] py-1 border-b border-slate-100 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">
                      {a.actorEmail || "System"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDateTime(a.createdAt)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    <strong className="text-slate-700">{a.action}</strong> {a.entityType}{" "}
                    {a.entityLabel ? `· ${a.entityLabel}` : ""}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
