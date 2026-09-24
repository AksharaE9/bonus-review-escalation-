"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateOnly } from "@/lib/dates";
import {
  FileCheck2,
  Plus,
  Search,
  RotateCcw,
  Star,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { ReviewRow } from "@/server/repos/review.repo";
import type { PaginatedResult, SessionUser } from "@/types";
import { acknowledgeReviewAction } from "@/server/actions/review";
import { toast } from "sonner";

interface ReviewsClientProps {
  user: SessionUser;
  reviewsData: PaginatedResult<ReviewRow>;
  filters: {
    status: string;
    reviewType: string;
    search: string;
  };
}

export function ReviewsClient({
  user,
  reviewsData,
  filters,
}: ReviewsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [ackModalOpen, setAckModalOpen] = useState(false);
  const [selectedReviewForAck, setSelectedReviewForAck] = useState<ReviewRow | null>(null);
  const [employeeComment, setEmployeeComment] = useState("");
  const [isSubmittingAck, setIsSubmittingAck] = useState(false);

  const [search, setSearch] = useState(filters.search);
  const [status, setStatus] = useState(filters.status);
  const [reviewType, setReviewType] = useState(filters.reviewType);

  const applyFilters = (overrides: {
    search?: string;
    status?: string;
    reviewType?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    const nextSearch = overrides.search !== undefined ? overrides.search : search;
    const nextStatus = overrides.status !== undefined ? overrides.status : status;
    const nextType = overrides.reviewType !== undefined ? overrides.reviewType : reviewType;

    if (nextSearch) params.set("search", nextSearch);
    else params.delete("search");

    if (nextStatus) params.set("status", nextStatus);
    else params.delete("status");

    if (nextType) params.set("reviewType", nextType);
    else params.delete("reviewType");

    router.push(`/reviews?${params.toString()}`);
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setReviewType("");
    router.push("/reviews");
  };

  const openAckModal = (rev: ReviewRow) => {
    setSelectedReviewForAck(rev);
    setEmployeeComment("");
    setAckModalOpen(true);
  };

  const handleAcknowledgeSubmit = async () => {
    if (!selectedReviewForAck) return;

    try {
      setIsSubmittingAck(true);
      const res = await acknowledgeReviewAction({
        reviewId: selectedReviewForAck.id,
        employeeComment: employeeComment.trim() || undefined,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to acknowledge review.");
        return;
      }

      toast.success("Performance review acknowledged successfully!");
      setAckModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error(`Error: ${(err as Error).message}`);
    } finally {
      setIsSubmittingAck(false);
    }
  };

  const isManagement = user.role === "ADMIN" || user.role === "LEAD";

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title={user.role === "USER" ? "My Performance Reviews" : "Performance Reviews"}
        description={
          user.role === "USER"
            ? "Review your formal evaluation scorecards, strengths, and acknowledge ratings."
            : "Manage competency evaluations, draft reviews, and monitor employee acknowledgements."
        }
        actions={
          isManagement ? (
            <Link href="/reviews/new">
              <Button size="sm" className="gap-1.5 h-8 text-xs bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-3.5 w-3.5" />
                <span>Write Review</span>
              </Button>
            </Link>
          ) : undefined
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-2 rounded-[8px] border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters({ search })}
              placeholder="Search by recipient or summary..."
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              applyFilters({ status: e.target.value });
            }}
            className="h-8 rounded-[4px] border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            {user.role !== "USER" && <option value="DRAFT">Draft</option>}
            <option value="SUBMITTED">Submitted</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* Review Type */}
          <select
            value={reviewType}
            onChange={(e) => {
              setReviewType(e.target.value);
              applyFilters({ reviewType: e.target.value });
            }}
            className="h-8 rounded-[4px] border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Cadences</option>
            <option value="HALF_YEARLY">HALF_YEARLY</option>
            <option value="ANNUAL">ANNUAL</option>
            <option value="QUARTERLY">QUARTERLY</option>
            <option value="MONTHLY">MONTHLY</option>
            <option value="PROBATION">PROBATION</option>
            <option value="PIP">PIP</option>
          </select>

          {(search || status || reviewType) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 gap-1 text-xs text-muted-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          Showing {reviewsData.rows.length} of {reviewsData.total} reviews
        </div>
      </div>

      {/* Reviews Table */}
      {reviewsData.rows.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No performance reviews found"
          description="Adjust your search criteria or create a new evaluation."
          action={
            isManagement ? (
              <Link href="/reviews/new">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  Write First Review
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-[8px] border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                    Cycle / Cadence
                  </th>
                  <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                    Executive Summary
                  </th>
                  <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                    Period End
                  </th>
                  <th className="p-3 text-right font-medium text-muted-foreground uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reviewsData.rows.map((rev) => {
                  const isRecipient = user.id === rev.employeeId;
                  const needsAck = isRecipient && rev.status === "SUBMITTED";

                  return (
                    <tr key={rev.id} className="transition-colors hover:bg-muted/40">
                      <td className="p-3">
                        <Link
                          href={`/employees/${rev.employeeId}?tab=reviews`}
                          className="font-medium text-foreground hover:text-indigo-600 hover:underline"
                        >
                          {rev.employeeName}
                        </Link>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {rev.employeeCode} {rev.departmentName ? `· ${rev.departmentName}` : ""}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-foreground">
                          {rev.cycleName || rev.reviewType}
                        </div>
                        <Badge variant="outline" className="text-[9px] mt-0.5">
                          {rev.reviewType}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 font-bold text-foreground tabular-nums">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                          <span>{rev.overallRating ? `${rev.overallRating} / 5.0` : "Pending"}</span>
                        </div>
                      </td>
                      <td className="p-3 max-w-sm text-foreground">
                        <p className="line-clamp-2">{rev.summary}</p>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <StatusBadge status={rev.status} />
                      </td>
                      <td className="p-3 whitespace-nowrap text-muted-foreground">
                        {formatDateOnly(rev.periodEnd)}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {needsAck && (
                            <Button
                              size="sm"
                              onClick={() => openAckModal(rev)}
                              className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Acknowledge</span>
                            </Button>
                          )}
                          <Link href={`/employees/${rev.employeeId}?tab=reviews`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              View Scorecard
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Acknowledgement Modal */}
      <Dialog open={ackModalOpen} onOpenChange={setAckModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Acknowledge Performance Review</DialogTitle>
            <DialogDescription>
              Acknowledge that you have reviewed this evaluation with your manager. You can optionally attach personal comments.
            </DialogDescription>
          </DialogHeader>

          {selectedReviewForAck && (
            <div className="space-y-3 py-2 text-xs">
              <div className="rounded-[4px] border border-border bg-muted/20 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    {selectedReviewForAck.cycleName || selectedReviewForAck.reviewType}
                  </span>
                  <div className="flex items-center gap-1 font-bold">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                    <span>{selectedReviewForAck.overallRating} / 5.0</span>
                  </div>
                </div>
                <p className="text-muted-foreground line-clamp-2">
                  {selectedReviewForAck.summary}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="employeeComment">Optional Comments / Response</Label>
                <Textarea
                  id="employeeComment"
                  rows={3}
                  value={employeeComment}
                  onChange={(e) => setEmployeeComment(e.target.value)}
                  placeholder="Share any thoughts, appreciation, or future goal commitments..."
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAckModalOpen(false)}
              disabled={isSubmittingAck}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAcknowledgeSubmit}
              disabled={isSubmittingAck}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmittingAck && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Sign & Acknowledge</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
