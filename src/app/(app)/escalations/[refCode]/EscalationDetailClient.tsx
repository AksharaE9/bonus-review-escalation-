"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/types";
import { EscalationRow } from "@/server/repos/escalation.repo";
import { StatusBadge } from "@/components/app/StatusBadge";
import { SeverityBadge } from "@/components/app/SeverityBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateEscalationStatusAction,
  addEscalationCommentAction,
  assignEscalationAction,
} from "@/server/actions/escalation";
import { formatDateTime } from "@/lib/dates";
import { toast } from "sonner";
import {
  Clock,
  User,
  CheckCircle2,
  Lock,
  EyeOff,
  Send,
  ArrowLeft,
  MessageSquare,
  History,
  CheckSquare,
  RotateCcw,
  XCircle,
  Loader2,
} from "lucide-react";

interface EscalationDetailClientProps {
  user: SessionUser;
  escalation: EscalationRow;
  subjectEmployee: {
    id: string;
    fullName: string;
    employeeCode: string;
    departmentName: string | null;
    designation: string | null;
    avatarUrl: string | null;
  } | null;
  assignableUsers: Array<{ id: string; fullName: string; role: string }>;
}

export function EscalationDetailClient({
  user,
  escalation,
  subjectEmployee,
  assignableUsers,
}: EscalationDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Comment state
  const [commentBody, setCommentBody] = useState("");
  const [commentVisibility, setCommentVisibility] = useState<"INTERNAL" | "SHARED">("SHARED");

  // Status transition dialog state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [statusComment, setStatusComment] = useState("");

  const isManagement = user.role !== "USER";
  const isRaiser = user.id === escalation.raisedBy;
  const isClosed = escalation.status === "CLOSED" || escalation.status === "WITHDRAWN";

  // Handle Comment Submission
  const handleAddComment = () => {
    if (!commentBody.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    startTransition(async () => {
      try {
        const res = await addEscalationCommentAction({
          escalationId: escalation.id,
          body: commentBody.trim(),
          visibility: isManagement ? commentVisibility : "SHARED",
        });
        if (res.success) {
          toast.success("Comment posted");
          setCommentBody("");
          router.refresh();
        }
      } catch (err: unknown) {
        toast.error((err as Error).message || "Failed to add comment");
      }
    });
  };

  // Open Status Transition Modal
  const promptStatusChange = (status: string) => {
    setTargetStatus(status);
    setResolutionText(escalation.resolution || "");
    setStatusComment("");
    setStatusModalOpen(true);
  };

  // Execute Status Transition
  const handleExecuteStatusChange = () => {
    if (!targetStatus) return;

    if (
      (targetStatus === "RESOLVED" || targetStatus === "CLOSED") &&
      (!resolutionText || resolutionText.trim().length < 10)
    ) {
      toast.error("Resolution must contain at least 10 characters explaining how this was resolved.");
      return;
    }

    if (escalation.status === "RESOLVED" && targetStatus === "IN_PROGRESS") {
      if (!statusComment || statusComment.trim().length < 5) {
        toast.error("Please provide a reason/comment for reopening this escalation.");
        return;
      }
    }

    startTransition(async () => {
      try {
        const res = await updateEscalationStatusAction(escalation.refCode, {
          status: targetStatus as import("@/types").EscalationStatus,
          resolution: resolutionText.trim() || undefined,
          comment: statusComment.trim() || undefined,
        });
        if (res.success) {
          toast.success(`Status transitioned to ${targetStatus}`);
          setStatusModalOpen(false);
          router.refresh();
        }
      } catch (err: unknown) {
        toast.error((err as Error).message || "Failed to update status");
      }
    });
  };

  // Handle Assignment
  const handleAssigneeChange = (newAssigneeId: string) => {
    const val = newAssigneeId === "unassigned" ? null : newAssigneeId;
    startTransition(async () => {
      try {
        const res = await assignEscalationAction(escalation.id, val);
        if (res.success) {
          toast.success("Assignee updated");
          router.refresh();
        }
      } catch (err: unknown) {
        toast.error((err as Error).message || "Failed to reassign");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/escalations"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Escalations
        </Link>
        <div className="flex items-center gap-2">
          {escalation.isConfidential && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              <Lock className="w-3 h-3 text-zinc-500" />
              Confidential
            </span>
          )}
          {escalation.isAnonymous && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              <EyeOff className="w-3 h-3 text-zinc-500" />
              Anonymous Raiser
            </span>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Details & Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Record Header Card */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none">
            <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    {escalation.refCode}
                  </span>
                  <StatusBadge status={escalation.status} />
                  <SeverityBadge severity={escalation.severity} />
                </div>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {escalation.origin === "EMPLOYEE" ? "Employee Complaint" : "Management Escalation"}
                </span>
              </div>
              <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mt-2">
                {escalation.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Description
                </Label>
                <div className="mt-1 text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed bg-zinc-50 dark:bg-zinc-900/50 p-3.5 rounded border border-zinc-200 dark:border-zinc-800">
                  {escalation.description}
                </div>
              </div>

              {/* Resolution Box */}
              {escalation.resolution && (
                <div className="p-3.5 rounded bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Official Resolution
                  </div>
                  <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed pl-5 whitespace-pre-wrap">
                    {escalation.resolution}
                  </p>
                  {escalation.resolvedAt && (
                    <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 pl-5 font-mono">
                      Resolved on {formatDateTime(escalation.resolvedAt)}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity / Timeline & Comments */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                <MessageSquare className="w-4 h-4 text-zinc-500" />
                Activity & Threaded Communication
              </CardTitle>
              <span className="text-[11px] text-zinc-400">
                {escalation.comments?.length || 0} entries
              </span>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Comment Thread List */}
              <div className="space-y-3">
                {escalation.comments?.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-400">
                    No activity recorded yet.
                  </div>
                ) : (
                  escalation.comments?.map((c) => {
                    const isInternal = c.visibility === "INTERNAL";
                    const isSystem = c.isStatusChange;

                    if (isSystem) {
                      return (
                        <div
                          key={c.id}
                          className="flex items-center gap-2 py-1.5 px-3 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 rounded border border-zinc-100 dark:border-zinc-800 font-mono"
                        >
                          <History className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>
                            <strong className="font-medium text-zinc-700 dark:text-zinc-300">
                              {c.authorName}
                            </strong>{" "}
                            {c.body}
                          </span>
                          <span className="ml-auto text-[10px] text-zinc-400">
                            {formatDateTime(c.createdAt)}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={c.id}
                        className={`p-3.5 rounded border text-xs space-y-1.5 ${
                          isInternal
                            ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-950 dark:text-amber-200"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {c.authorName}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                              {c.authorRole}
                            </span>
                            {isInternal && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-800">
                                Internal Note
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {formatDateTime(c.createdAt)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{c.body}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Comment Composer */}
              {!isClosed ? (
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Add a Response / Update
                    </Label>
                    {isManagement && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCommentVisibility("SHARED")}
                          className={`px-2.5 py-1 text-[11px] rounded font-medium border transition-colors ${
                            commentVisibility === "SHARED"
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 border-zinc-900 dark:border-zinc-100"
                              : "bg-white text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
                          }`}
                        >
                          Reply to Employee (Shared)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCommentVisibility("INTERNAL")}
                          className={`px-2.5 py-1 text-[11px] rounded font-medium border transition-colors ${
                            commentVisibility === "INTERNAL"
                              ? "bg-amber-600 text-white border-amber-600"
                              : "bg-white text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
                          }`}
                        >
                          Internal Note (Management Only)
                        </button>
                      </div>
                    )}
                  </div>

                  <Textarea
                    rows={3}
                    placeholder={
                      commentVisibility === "INTERNAL"
                        ? "Write an internal note for HR and management only (hidden from employee)..."
                        : "Write a message or update visible to the employee..."
                    }
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    className="text-xs resize-none"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">
                      {commentVisibility === "INTERNAL"
                        ? "🔒 Visible only to Leads and Admins"
                        : "👁 Visible to all parties involved"}
                    </span>
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={isPending || !commentBody.trim()}
                      className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs gap-1.5"
                    >
                      {isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Post Update
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-3 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-100 dark:border-zinc-800">
                  This escalation is {escalation.status.toLowerCase()} and cannot receive further comments.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Controls & SLA Metadata */}
        <div className="space-y-6">
          {/* Action / Workflow Controls */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Status Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {isManagement && escalation.status === "OPEN" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs justify-start gap-2"
                  onClick={() => promptStatusChange("ACKNOWLEDGED")}
                  disabled={isPending}
                >
                  <CheckSquare className="w-3.5 h-3.5 text-sky-600" />
                  Acknowledge Receipt
                </Button>
              )}

              {isManagement &&
                (escalation.status === "OPEN" ||
                  escalation.status === "ACKNOWLEDGED" ||
                  escalation.status === "AWAITING_EMPLOYEE") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs justify-start gap-2"
                    onClick={() => promptStatusChange("IN_PROGRESS")}
                    disabled={isPending}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Move to In Progress
                  </Button>
                )}

              {isManagement && escalation.status === "IN_PROGRESS" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs justify-start gap-2"
                  onClick={() => promptStatusChange("AWAITING_EMPLOYEE")}
                  disabled={isPending}
                >
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  Request Employee Input
                </Button>
              )}

              {isManagement &&
                (escalation.status === "IN_PROGRESS" ||
                  escalation.status === "AWAITING_EMPLOYEE") && (
                  <Button
                    size="sm"
                    className="w-full text-xs justify-start gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => promptStatusChange("RESOLVED")}
                    disabled={isPending}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Resolved
                  </Button>
                )}

              {isManagement && escalation.status === "RESOLVED" && (
                <>
                  <Button
                    size="sm"
                    className="w-full text-xs justify-start gap-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-950"
                    onClick={() => promptStatusChange("CLOSED")}
                    disabled={isPending}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Close Escalation (Terminal)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs justify-start gap-2 text-rose-600 hover:text-rose-700"
                    onClick={() => promptStatusChange("IN_PROGRESS")}
                    disabled={isPending}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reopen Escalation
                  </Button>
                </>
              )}

              {/* Raiser withdrawal */}
              {(isRaiser || user.role === "ADMIN") &&
                !isClosed &&
                escalation.status !== "RESOLVED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs justify-start gap-2 text-zinc-500 hover:text-zinc-900"
                    onClick={() => promptStatusChange("WITHDRAWN")}
                    disabled={isPending}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Withdraw Escalation
                  </Button>
                )}
            </CardContent>
          </Card>

          {/* SLA & Time Metrics Card */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                SLA & Resolution Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">SLA Status</span>
                {escalation.slaBreached ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                    SLA Breached
                  </span>
                ) : isClosed || escalation.status === "RESOLVED" ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolved in SLA
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    On Track
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2">
                <span className="text-zinc-500">Target Resolution</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100">
                  {escalation.dueAt ? formatDateTime(escalation.dueAt) : "N/A"}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2">
                <span className="text-zinc-500">Registered</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300">
                  {formatDateTime(escalation.createdAt)}
                </span>
              </div>

              {escalation.firstResponseAt && (
                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2">
                  <span className="text-zinc-500">First Response</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">
                    {formatDateTime(escalation.firstResponseAt)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* People & Assignment Card */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                People & Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-xs">
              {/* Raiser */}
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  Raised By
                </Label>
                <div className="font-medium text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {escalation.raisedByName}
                </div>
              </div>

              {/* Subject Employee */}
              {subjectEmployee ? (
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2.5">
                  <Label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    Subject Employee
                  </Label>
                  <Link
                    href={`/employees/${subjectEmployee.id}`}
                    className="block mt-0.5 group"
                  >
                    <div className="font-medium text-indigo-600 dark:text-indigo-400 group-hover:underline">
                      {subjectEmployee.fullName} ({subjectEmployee.employeeCode})
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {subjectEmployee.designation || subjectEmployee.departmentName || "Staff"}
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2.5">
                  <Label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    Subject
                  </Label>
                  <div className="text-zinc-500 mt-0.5">General Organisation / Workplace</div>
                </div>
              )}

              {/* Assigned To */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2.5">
                <Label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  Assigned Handler
                </Label>
                {isManagement && !isClosed ? (
                  <Select
                    value={escalation.assignedTo || "unassigned"}
                    onValueChange={handleAssigneeChange}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-full text-xs mt-1 h-8">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned" className="text-xs">
                        -- Unassigned --
                      </SelectItem>
                      {assignableUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id} className="text-xs">
                          {u.fullName} ({u.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="font-medium text-zinc-700 dark:text-zinc-300 mt-0.5">
                    {escalation.assignedToName || "Unassigned"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Transition Dialog */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              Transition Status: {targetStatus}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              {targetStatus === "RESOLVED" || targetStatus === "CLOSED"
                ? "Please record the formal resolution details for this escalation. This will be visible to the employee."
                : targetStatus === "IN_PROGRESS" && escalation.status === "RESOLVED"
                ? "Please state the reason for reopening this escalation."
                : `Confirm changing status to ${targetStatus}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {(targetStatus === "RESOLVED" || targetStatus === "CLOSED") && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Resolution Summary * (min 10 characters)
                </Label>
                <Textarea
                  rows={4}
                  placeholder="Detail the actions taken, repairs performed, policy warnings issued, or agreements made..."
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>
            )}

            {(targetStatus === "IN_PROGRESS" && escalation.status === "RESOLVED") ||
            targetStatus === "WITHDRAWN" ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Reason / Comment *
                </Label>
                <Textarea
                  rows={3}
                  placeholder="Explain why this action is being taken..."
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>
            ) : null}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStatusModalOpen(false)}
              disabled={isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleExecuteStatusChange}
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirm Transition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
