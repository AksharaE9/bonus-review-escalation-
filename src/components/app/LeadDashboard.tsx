"use client";

import React from "react";
import Link from "next/link";
import type { SessionUser } from "@/types";
import { LeadDashboardData } from "@/server/repos/dashboard.repo";
import { StatTile } from "@/components/app/StatTile";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatINR } from "@/lib/money";
import {
  Users,
  Clock,
  ShieldAlert,
  FileCheck,
  Plus,
  ArrowRight,
  Star,
  ExternalLink,
} from "lucide-react";

interface LeadDashboardProps {
  user?: SessionUser;
  data: LeadDashboardData;
}

export function LeadDashboard({ data }: LeadDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Department Operations Console"
        description="Monitor performance cycles, award bonuses, track team escalations, and review direct reports."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/reviews/new">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Write Review
              </Button>
            </Link>
            <Link href="/employees">
              <Button variant="outline" size="sm" className="text-xs h-8">
                My Team
              </Button>
            </Link>
          </div>
        }
      />

      {/* 4 Metric Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile
          label="Department Members"
          value={data.stats.teamSize}
          icon={Users}
        />
        <StatTile
          label="Bonuses In Approval"
          value={data.stats.pendingTeamBonuses}
          icon={Clock}
        />
        <StatTile
          label="Open Team Escalations"
          value={data.stats.openTeamEscalations}
          icon={ShieldAlert}
        />
        <StatTile
          label="Reviews To Complete"
          value={data.stats.reviewsPendingFromMe}
          icon={FileCheck}
        />
      </div>

      {/* Pending Actions Panel */}
      {data.pendingActions.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 shadow-none">
          <CardHeader className="pb-3 border-b border-amber-100 dark:border-amber-900/40">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Action Required from You
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 divide-y divide-amber-100 dark:divide-amber-900/30">
            {data.pendingActions.map((action) => (
              <div key={action.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {action.title}
                  </div>
                  <div className="text-[11px] text-zinc-500">{action.subtitle}</div>
                </div>
                <Link href={action.link}>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-amber-300 hover:bg-amber-100 dark:border-amber-800">
                    Resume <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Team Roster with Quick Metrics */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Department Roster & Overview
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 mt-0.5">
              Performance ratings, YTD bonuses, and escalation status for direct reports
            </CardDescription>
          </div>
          <Link href="/employees" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
            View directory →
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
              <TableRow className="border-b border-zinc-200 dark:border-zinc-800">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                  Employee
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                  Designation
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">
                  YTD Bonus
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-center">
                  Latest Rating
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-center">
                  Active Escalations
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.teamRoster.map((member) => (
                <TableRow key={member.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800">
                  <TableCell>
                    <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                      {member.fullName}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">{member.employeeCode}</div>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-600 dark:text-zinc-300">
                    {member.designation || "Staff Member"}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-medium text-right text-zinc-900 dark:text-zinc-100">
                    {formatINR(member.totalBonusYtd)}
                  </TableCell>
                  <TableCell className="text-center">
                    {member.latestRating ? (
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {member.latestRating.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {member.openEscalations > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                        <span className="w-2 h-2 rounded-full bg-rose-600" />
                        {member.openEscalations}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/employees/${member.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                        Profile <ExternalLink className="w-3 h-3" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
