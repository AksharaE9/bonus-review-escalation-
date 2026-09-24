"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/types";
import { UserDashboardData } from "@/server/repos/dashboard.repo";
import { StatTile } from "@/components/app/StatTile";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatINR } from "@/lib/money";
import { formatDateOnly } from "@/lib/dates";
import { acknowledgeReviewAction } from "@/server/actions/review";
import { toast } from "sonner";
import {
  IndianRupee,
  Star,
  ShieldAlert,
  AlertCircle,
  Plus,
  Loader2,
} from "lucide-react";

interface UserDashboardProps {
  user: SessionUser;
  data: UserDashboardData;
}

export function UserDashboard({ user, data }: UserDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Acknowledge modal state
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [ackComment, setAckComment] = useState("");

  const handleAcknowledge = () => {
    if (!selectedReviewId) return;
    startTransition(async () => {
      try {
        const res = await acknowledgeReviewAction({
          reviewId: selectedReviewId,
          employeeComment: ackComment.trim() || undefined,
        });
        if (res.success) {
          toast.success("Review acknowledged successfully");
          setSelectedReviewId(null);
          setAckComment("");
          router.refresh();
        } else {
          toast.error(res.error || "Failed to acknowledge review");
        }
      } catch (err: unknown) {
        toast.error((err as Error).message || "Failed to acknowledge review");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`Welcome back, ${user.fullName.split(" ")[0]}`}
        description="Track your performance evaluations, awarded bonuses, and registered workplace requests."
        actions={
          <Link href="/escalations/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Raise a Complaint / Grievance
            </Button>
          </Link>
        }
      />

      {/* Unacknowledged Review Persistent Banner */}
      {data.unacknowledgedReviews.length > 0 && (
        <div className="p-4 rounded border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <div className="font-semibold text-xs text-amber-950 dark:text-amber-100">
                Action Required: Pending Performance Review Acknowledgement
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Your manager ({data.unacknowledgedReviews[0].reviewerName}) has submitted your
                evaluation with an overall score of{" "}
                <strong>{data.unacknowledgedReviews[0].overallRating?.toFixed(1) || "—"} / 5.0</strong>.
                Please review and submit your acknowledgement.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setSelectedReviewId(data.unacknowledgedReviews[0].id)}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs whitespace-nowrap"
          >
            Review & Acknowledge
          </Button>
        </div>
      )}

      {/* 3 Metric Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile
          label="Total Bonuses Awarded (FY)"
          value={formatINR(data.stats.ytdBonusTotal)}
          icon={IndianRupee}
        />
        <StatTile
          label="Latest Overall Rating"
          value={
            data.stats.latestRating
              ? `${data.stats.latestRating.toFixed(1)} / 5.0`
              : "—"
          }
          icon={Star}
        />
        <StatTile
          label="My Active Complaints"
          value={data.stats.openComplaintsCount}
          icon={ShieldAlert}
        />
      </div>

      {/* 3 Personal Modules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module 1: Recent Bonuses */}
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              My Bonuses
            </CardTitle>
            <Link href="/bonuses" className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="pt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.recentBonuses.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-400">
                No bonus records found.
              </div>
            ) : (
              data.recentBonuses.map((b) => (
                <div key={b.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatINR(b.amount)}
                    </span>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                    {b.reason}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 font-mono">
                    <span>{b.bonusType}</span>
                    <span>{formatDateOnly(b.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Module 2: Performance Reviews */}
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              My Performance Reviews
            </CardTitle>
            <Link href="/reviews" className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="pt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.recentReviews.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-400">
                No performance reviews recorded yet.
              </div>
            ) : (
              data.recentReviews.map((r) => (
                <div key={r.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {r.reviewType} Review
                    </span>
                    {r.overallRating ? (
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {r.overallRating.toFixed(1)}
                      </span>
                    ) : (
                      <StatusBadge status={r.status} />
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    By {r.reviewerName} · Period: {formatDateOnly(r.periodStart)} – {formatDateOnly(r.periodEnd)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Module 3: My Grievances & Complaints */}
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              My Complaints & Requests
            </CardTitle>
            <Link href="/escalations" className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="pt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.recentEscalations.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-400">
                No active complaints registered.
              </div>
            ) : (
              data.recentEscalations.map((e) => (
                <Link
                  key={e.id}
                  href={`/escalations/${e.refCode}`}
                  className="block py-2.5 space-y-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                      {e.refCode}
                    </span>
                    <StatusBadge status={e.status} />
                  </div>
                  <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200 line-clamp-1">
                    {e.title}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {formatDateOnly(e.createdAt)}
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Acknowledge Review Modal */}
      <Dialog
        open={Boolean(selectedReviewId)}
        onOpenChange={(open) => !open && setSelectedReviewId(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              Acknowledge Performance Review
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              By confirming, you acknowledge that you have read and discussed this performance review.
              You may optionally add employee feedback/comments.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Employee Response / Comments (Optional)
              </label>
              <Textarea
                rows={3}
                placeholder="Share any reflections, comments, or agreed next steps..."
                value={ackComment}
                onChange={(e) => setAckComment(e.target.value)}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedReviewId(null)}
              disabled={isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAcknowledge}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirm Acknowledgement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
