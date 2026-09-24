"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { StatTile } from "@/components/app/StatTile";
import { StatusBadge } from "@/components/app/StatusBadge";
import { SeverityBadge } from "@/components/app/SeverityBadge";
import { MoneyCell } from "@/components/app/MoneyCell";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatINR } from "@/lib/money";
import { formatDateTime, formatDateOnly } from "@/lib/dates";
import {
  Award,
  FileCheck2,
  AlertOctagon,
  ShieldCheck,
  Building,
  User,
  Calendar,
  Plus,
  ChevronDown,
  ChevronRight,
  Star,
  Printer,
  History,
} from "lucide-react";
import type { SessionUser } from "@/types";
import type { EmployeeProfileSummary, ActivityTimelineItem } from "@/server/repos/employee-profile.repo";
import type { BonusRow } from "@/server/repos/bonus.repo";
import type { ReviewRow } from "@/server/repos/review.repo";
import type { EscalationRow } from "@/server/repos/escalation.repo";
import type { AuditLogRow } from "@/server/repos/audit.repo";

interface ProfileClientProps {
  actor: SessionUser;
  profileSummary: EmployeeProfileSummary;
  activeTab: string;
  tabData: {
    timelineItems: ActivityTimelineItem[];
    bonusesList: BonusRow[];
    reviewsList: ReviewRow[];
    escalationsList: EscalationRow[];
    auditLogsList: AuditLogRow[];
  };
}

export function ProfileClient({
  actor,
  profileSummary,
  activeTab,
  tabData,
}: ProfileClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { employee, stats, tabCounts } = profileSummary;

  const [expandedBonusId, setExpandedBonusId] = useState<string | null>(null);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`/employees/${employee.id}?${params.toString()}`);
  };

  const isManagement = actor.role === "ADMIN" || actor.role === "LEAD";

  return (
    <div className="space-y-6">
      {/* Header Block */}
      <div className="flex flex-col gap-4 rounded-[8px] border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xl font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
            {employee.fullName.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {employee.fullName}
              </h1>
              <Badge variant="outline" className="font-mono text-[10px]">
                {employee.employeeCode}
              </Badge>
              <StatusBadge status={employee.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              {employee.designation || "Staff Member"}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                {employee.departmentName || "General"}
              </span>
              {employee.managerName && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Manager: <strong className="text-foreground">{employee.managerName}</strong>
                </span>
              )}
              {employee.dateOfJoining && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined: {formatDateOnly(employee.dateOfJoining)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print Scorecard View */}
          <Link
            href={`/employees/${employee.id}/scorecard?print=1`}
            target="_blank"
          >
            <Button variant="outline" size="sm" className="gap-1.5 h-8">
              <Printer className="h-3.5 w-3.5" />
              <span>Scorecard</span>
            </Button>
          </Link>

          {isManagement && (
            <>
              <Link href={`/bonuses?action=new&employeeId=${employee.id}`}>
                <Button size="sm" className="gap-1.5 h-8 bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Bonus</span>
                </Button>
              </Link>
              <Link href={`/reviews/new?employeeId=${employee.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5 h-8">
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>Write Review</span>
                </Button>
              </Link>
              <Link href={`/escalations/new?subjectId=${employee.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-rose-600 dark:text-rose-400">
                  <AlertOctagon className="h-3.5 w-3.5" />
                  <span>Escalation</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Summary Strip (4 Metric Stat Tiles) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Total Bonus (YTD)"
          value={formatINR(stats.totalBonusApprovedYtd)}
          subtext="Approved & Paid payouts"
          icon={Award}
        />
        <StatTile
          label="Bonuses Count"
          value={stats.totalBonusCount}
          subtext="All bonus records"
          icon={Award}
        />
        <StatTile
          label="Latest Rating"
          value={stats.latestReviewRating ? `${stats.latestReviewRating} / 5.0` : "—"}
          subtext="From most recent cycle"
          icon={Star}
        />
        <StatTile
          label="Open Escalations"
          value={stats.openEscalationsCount}
          subtext="Active issues pending resolution"
          icon={AlertOctagon}
          badge={
            stats.openEscalationsCount > 0 ? (
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            ) : undefined
          }
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="border-b border-border w-full justify-start gap-2">
          <TabsTrigger value="overview" className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            <span>Overview</span>
            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground">
              {tabCounts.overview}
            </span>
          </TabsTrigger>
          <TabsTrigger value="bonus" className="gap-1.5">
            <Award className="h-3.5 w-3.5" />
            <span>Bonus</span>
            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground">
              {tabCounts.bonuses}
            </span>
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-1.5">
            <FileCheck2 className="h-3.5 w-3.5" />
            <span>Reviews</span>
            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground">
              {tabCounts.reviews}
            </span>
          </TabsTrigger>
          <TabsTrigger value="escalations" className="gap-1.5">
            <AlertOctagon className="h-3.5 w-3.5" />
            <span>Escalations</span>
            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground">
              {tabCounts.escalations}
            </span>
          </TabsTrigger>
          {actor.role === "ADMIN" && (
            <TabsTrigger value="audit" className="gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Audit</span>
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground">
                {tabCounts.audit}
              </span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab 1: Overview Timeline */}
        <TabsContent value="overview" className="pt-4">
          {tabData.timelineItems.length === 0 ? (
            <EmptyState
              icon={History}
              title="No recent activity"
              description="Bonuses, performance evaluations, and escalations will appear in this unified timeline."
            />
          ) : (
            <div className="relative border-l border-border ml-4 pl-6 space-y-6">
              {tabData.timelineItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-1 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-foreground">
                    {item.type === "BONUS" && <Award className="h-3 w-3 text-indigo-600" />}
                    {item.type === "REVIEW" && <FileCheck2 className="h-3 w-3 text-emerald-600" />}
                    {item.type === "ESCALATION" && <AlertOctagon className="h-3 w-3 text-rose-600" />}
                  </div>

                  {/* Card Content */}
                  <div className="rounded-[6px] border border-border bg-card p-4 transition-subtle hover:border-zinc-400">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground">
                          {item.title}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDateTime(item.date)}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.subtitle}
                    </p>

                    {item.amount && (
                      <div className="mt-2 text-sm font-bold text-foreground">
                        <MoneyCell amount={item.amount} />
                      </div>
                    )}
                    {item.rating && (
                      <div className="mt-2 text-xs font-semibold text-foreground">
                        Overall Rating: {item.rating} / 5.0
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Bonus */}
        <TabsContent value="bonus" className="pt-4">
          <div className="space-y-4">
            {/* Tab Header with sum */}
            <div className="flex items-center justify-between rounded-[6px] border border-border bg-card p-3">
              <span className="text-xs font-medium text-muted-foreground">
                Approved Bonus Total: <strong className="text-foreground text-sm font-bold tabular-nums font-mono-num">{formatINR(stats.totalBonusApprovedYtd)}</strong>
              </span>
              {isManagement && (
                <Link href={`/bonuses?action=new&employeeId=${employee.id}`}>
                  <Button size="sm" className="h-7 text-xs gap-1 bg-indigo-600">
                    <Plus className="h-3 w-3" />
                    <span>Award Bonus</span>
                  </Button>
                </Link>
              )}
            </div>

            {tabData.bonusesList.length === 0 ? (
              <EmptyState
                icon={Award}
                title="No bonus records"
                description="No bonuses have been recorded for this employee yet."
              />
            ) : (
              <div className="overflow-hidden rounded-[8px] border border-border bg-card">
                <table className="w-full text-xs">
                  <thead className="border-b border-border bg-muted/40">
                    <tr>
                      <th className="w-8 p-3"></th>
                      <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                        Type
                      </th>
                      <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                        Awarded Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tabData.bonusesList.map((b) => {
                      const isExpanded = expandedBonusId === b.id;
                      return (
                        <React.Fragment key={b.id}>
                          <tr
                            onClick={() =>
                              setExpandedBonusId(isExpanded ? null : b.id)
                            }
                            className="cursor-pointer transition-colors hover:bg-muted/40"
                          >
                            <td className="p-3 text-center text-muted-foreground">
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </td>
                            <td className="p-3 font-bold text-foreground text-sm tabular-nums font-mono-num">
                              <MoneyCell amount={b.amount} />
                            </td>
                            <td className="p-3">
                              <Badge variant="outline">{b.bonusType}</Badge>
                            </td>
                            <td className="p-3 font-normal text-foreground max-w-md">
                              <span className={isExpanded ? "" : "line-clamp-2"}>
                                {b.reason}
                              </span>
                            </td>
                            <td className="p-3">
                              <StatusBadge status={b.status} />
                            </td>
                            <td className="p-3 text-muted-foreground whitespace-nowrap">
                              {formatDateOnly(b.createdAt)}
                            </td>
                          </tr>

                          {/* Expanded Detail Panel */}
                          {isExpanded && (
                            <tr className="bg-muted/10">
                              <td colSpan={6} className="p-4 pl-11">
                                <div className="space-y-3">
                                  <div>
                                    <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                      Full Bonus Justification
                                    </h5>
                                    <p className="mt-1 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                                      {b.reason}
                                    </p>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-border">
                                    <div>
                                      <span className="text-muted-foreground">Period Month:</span>{" "}
                                      <strong className="text-foreground">{b.periodMonth || "—"}</strong>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Payout Date:</span>{" "}
                                      <strong className="text-foreground">{b.payoutDate ? formatDateOnly(b.payoutDate) : "Pending"}</strong>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Awarded By:</span>{" "}
                                      <strong className="text-foreground">{b.awardedByName || "Lead"}</strong>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Approved By:</span>{" "}
                                      <strong className="text-foreground">{b.approvedByName || "—"}</strong>
                                    </div>
                                  </div>

                                  {b.rejectionReason && (
                                    <div className="rounded-[4px] border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
                                      <strong>Rejection Reason:</strong> {b.rejectionReason}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Reviews */}
        <TabsContent value="reviews" className="pt-4">
          <div className="space-y-4">
            {tabData.reviewsList.length === 0 ? (
              <EmptyState
                icon={FileCheck2}
                title="No performance reviews"
                description="Performance review cycles and scores will appear here."
              />
            ) : (
              tabData.reviewsList.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-[8px] border border-border bg-card p-5 space-y-4"
                >
                  {/* Review Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-foreground">
                          {rev.cycleName || `${rev.reviewType} Review`}
                        </h4>
                        <Badge variant="outline">{rev.reviewType}</Badge>
                        <StatusBadge status={rev.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Period: {formatDateOnly(rev.periodStart)} – {formatDateOnly(rev.periodEnd)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded-[6px] border border-border bg-muted/30 px-3 py-1 text-sm font-bold text-foreground">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                        <span>{rev.overallRating ? `${rev.overallRating} / 5.0` : "Pending Rating"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Competency Score Bars */}
                  {rev.ratings && rev.ratings.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Competency Breakdown
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {rev.ratings.map((cat) => (
                          <div
                            key={cat.competencyId}
                            className="rounded-[4px] border border-border bg-muted/20 p-2.5 text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-foreground">
                                {cat.competencyName}
                              </span>
                              <span className="font-mono font-bold text-foreground tabular-nums">
                                {cat.score} / 5.0
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full"
                                style={{
                                  width: `${(parseFloat(cat.score) / 5.0) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary & Narrative */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <strong className="text-muted-foreground">Executive Summary:</strong>
                      <p className="mt-0.5 text-foreground leading-relaxed">{rev.summary}</p>
                    </div>
                    {rev.strengths && (
                      <div>
                        <strong className="text-emerald-600 dark:text-emerald-400">Key Strengths:</strong>
                        <p className="mt-0.5 text-foreground">{rev.strengths}</p>
                      </div>
                    )}
                    {rev.improvements && (
                      <div>
                        <strong className="text-amber-600 dark:text-amber-400">Areas for Growth:</strong>
                        <p className="mt-0.5 text-foreground">{rev.improvements}</p>
                      </div>
                    )}
                  </div>

                  {/* Employee Acknowledgement */}
                  {rev.employeeComment && (
                    <div className="rounded-[6px] border border-border bg-muted/20 p-3 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
                        <span>Employee Acknowledgement</span>
                        <span className="text-muted-foreground font-normal">
                          ({rev.acknowledgedAt ? formatDateOnly(rev.acknowledgedAt) : ""})
                        </span>
                      </div>
                      <p className="text-muted-foreground italic">&ldquo;{rev.employeeComment}&rdquo;</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Tab 4: Escalations */}
        <TabsContent value="escalations" className="pt-4">
          <div className="space-y-4">
            {tabData.escalationsList.length === 0 ? (
              <EmptyState
                icon={AlertOctagon}
                title="No escalations"
                description="No active or historical escalations are logged for this employee."
              />
            ) : (
              <div className="overflow-hidden rounded-[8px] border border-border bg-card">
                <table className="w-full text-xs">
                  <thead className="border-b border-border bg-muted/40">
                    <tr>
                      <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                        Ref Code
                      </th>
                      <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                        Title / Summary
                      </th>
                      <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                        Category
                      </th>
                      <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                        SLA Status
                      </th>
                      <th className="p-3 text-right font-medium text-muted-foreground uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tabData.escalationsList.map((esc) => (
                      <tr key={esc.id} className="transition-colors hover:bg-muted/40">
                        <td className="p-3 font-mono text-[11px] font-semibold text-foreground">
                          {esc.refCode}
                        </td>
                        <td className="p-3 font-medium text-foreground max-w-sm truncate">
                          {esc.title}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{esc.category}</Badge>
                        </td>
                        <td className="p-3">
                          <SeverityBadge severity={esc.severity} />
                        </td>
                        <td className="p-3">
                          <StatusBadge status={esc.status} />
                        </td>
                        <td className="p-3">
                          {esc.slaBreached ? (
                            <div className="flex items-center gap-1.5 text-rose-600 font-semibold text-[11px]">
                              <span className="h-2 w-2 rounded-full bg-rose-600" />
                              <span>SLA Breached</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-emerald-600 text-[11px]">
                              <span className="h-2 w-2 rounded-full bg-emerald-600" />
                              <span>Within SLA</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <Link href={`/escalations/${esc.refCode}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              Details →
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 5: Audit (Admin only) */}
        {actor.role === "ADMIN" && (
          <TabsContent value="audit" className="pt-4">
            <div className="space-y-4">
              {tabData.auditLogsList.length === 0 ? (
                <EmptyState
                  icon={ShieldCheck}
                  title="No direct audit events"
                  description="All scoped mutations concerning this user profile will appear here."
                />
              ) : (
                <div className="overflow-hidden rounded-[8px] border border-border bg-card">
                  <table className="w-full text-xs">
                    <thead className="border-b border-border bg-muted/40">
                      <tr>
                        <th className="p-2.5 text-left font-medium text-muted-foreground uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="p-2.5 text-left font-medium text-muted-foreground uppercase tracking-wider">
                          Actor
                        </th>
                        <th className="p-2.5 text-left font-medium text-muted-foreground uppercase tracking-wider">
                          Action
                        </th>
                        <th className="p-2.5 text-left font-medium text-muted-foreground uppercase tracking-wider">
                          Event Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {tabData.auditLogsList.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/40">
                          <td className="p-2.5 text-muted-foreground whitespace-nowrap">
                            {formatDateTime(log.createdAt)}
                          </td>
                          <td className="p-2.5 text-foreground font-medium whitespace-nowrap">
                            {log.actorEmail || "System"}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <Badge variant="outline">{log.action}</Badge>
                          </td>
                          <td className="p-2.5 text-foreground">
                            {log.entityLabel || log.entityId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
