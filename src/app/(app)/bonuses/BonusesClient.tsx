"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { MoneyCell } from "@/components/app/MoneyCell";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { BonusModal } from "@/components/app/BonusModal";
import { formatINR } from "@/lib/money";
import { formatDateOnly } from "@/lib/dates";
import {
  Award,
  Plus,
  Download,
  Search,
  RotateCcw,
  CheckCircle2,
  XCircle,
  CreditCard,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { BonusRow } from "@/server/repos/bonus.repo";
import type { PaginatedResult, SessionUser } from "@/types";
import {
  approveBonusAction,
  rejectBonusAction,
  markPaidBonusAction,
  bulkApproveBonusesAction,
} from "@/server/actions/bonus";
import { toast } from "sonner";

interface BonusesClientProps {
  user: SessionUser;
  bonusesData: PaginatedResult<BonusRow>;
  summary: { totalApprovedAmount: string; totalPendingAmount: string };
  employees: Array<{ id: string; fullName: string; employeeCode: string; departmentName?: string | null }>;
  filters: {
    status: string;
    bonusType: string;
    search: string;
  };
  initialAction?: string;
  preselectedEmployeeId?: string;
}

export function BonusesClient({
  user,
  bonusesData,
  summary,
  employees,
  filters,
  initialAction,
  preselectedEmployeeId,
}: BonusesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [createModalOpen, setCreateModalOpen] = useState(initialAction === "new");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedBonusForReject, setSelectedBonusForReject] = useState<BonusRow | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [expandedBonusId, setExpandedBonusId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const [search, setSearch] = useState(filters.search);
  const [status, setStatus] = useState(filters.status);
  const [bonusType, setBonusType] = useState(filters.bonusType);

  const applyFilters = (overrides: {
    search?: string;
    status?: string;
    bonusType?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    const nextSearch = overrides.search !== undefined ? overrides.search : search;
    const nextStatus = overrides.status !== undefined ? overrides.status : status;
    const nextType = overrides.bonusType !== undefined ? overrides.bonusType : bonusType;

    if (nextSearch) params.set("search", nextSearch);
    else params.delete("search");

    if (nextStatus) params.set("status", nextStatus);
    else params.delete("status");

    if (nextType) params.set("bonusType", nextType);
    else params.delete("bonusType");

    router.push(`/bonuses?${params.toString()}`);
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setBonusType("");
    router.push("/bonuses");
  };

  const handleApprove = async (bonusId: string) => {
    try {
      setIsProcessing(true);
      const res = await approveBonusAction(bonusId);
      if (!res.success) {
        toast.error(res.error || "Approval failed.");
        return;
      }
      toast.success("Bonus approved successfully (audited)!");
      router.refresh();
    } catch (err: unknown) {
      toast.error(`Error: ${(err as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectModal = (bonus: BonusRow) => {
    setSelectedBonusForReject(bonus);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedBonusForReject) return;
    if (rejectionReason.trim().length < 10) {
      toast.error("Rejection reason must be at least 10 characters.");
      return;
    }

    try {
      setIsProcessing(true);
      const res = await rejectBonusAction({
        bonusId: selectedBonusForReject.id,
        rejectionReason: rejectionReason.trim(),
      });
      if (!res.success) {
        toast.error(res.error || "Rejection failed.");
        return;
      }
      toast.success("Bonus nomination rejected (audited).");
      setRejectModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error(`Error: ${(err as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkPaid = async (bonusId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      setIsProcessing(true);
      const res = await markPaidBonusAction({
        bonusId,
        payoutDate: today,
      });
      if (!res.success) {
        toast.error(res.error || "Failed to mark paid.");
        return;
      }
      toast.success("Bonus marked as PAID with today's disbursement date.");
      router.refresh();
    } catch (err: unknown) {
      toast.error(`Error: ${(err as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsProcessing(true);
      const res = await bulkApproveBonusesAction(selectedIds);
      if (!res.success) {
        toast.error(res.error || "Bulk approval failed.");
        return;
      }
      toast.success(`Successfully approved ${res.count} bonuses!`);
      setSelectedIds([]);
      router.refresh();
    } catch (err: unknown) {
      toast.error(`Error: ${(err as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      toast.info("Generating bonus export CSV...");
      const res = await fetch("/api/export/bonuses");
      if (!res.ok) throw new Error("Failed to export bonuses");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pulse-bonuses-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Bonuses exported to CSV (audited).");
    } catch (err: unknown) {
      toast.error(`Export failed: ${(err as Error).message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const isManagement = user.role === "ADMIN" || user.role === "LEAD";
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        title={user.role === "USER" ? "My Bonuses" : "Bonus Management"}
        description={
          user.role === "USER"
            ? "Track all approved bonuses and incentive payouts awarded to you."
            : "Review, approve, and disburse operational performance and spot bonuses."
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="gap-1.5 h-8 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
            {isManagement && (
              <Button
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                className="gap-1.5 h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Award Bonus</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Summary Sum Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-border bg-card p-4">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Approved Disbursals
            </span>
            <div className="text-xl font-bold text-foreground tabular-nums font-mono-num">
              {formatINR(summary.totalApprovedAmount)}
            </div>
          </div>
          {isAdmin && (
            <div className="border-l border-border pl-6">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Pending Approvals
              </span>
              <div className="text-xl font-bold text-foreground tabular-nums font-mono-num">
                {formatINR(summary.totalPendingAmount)}
              </div>
            </div>
          )}
        </div>

        {/* Bulk Action Controls */}
        {isAdmin && selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {selectedIds.length} selected
            </span>
            <Button
              size="sm"
              onClick={handleBulkApprove}
              disabled={isProcessing}
              className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Bulk Approve</span>
            </Button>
          </div>
        )}
      </div>

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
              placeholder="Search recipient or reason..."
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* Status Filter */}
          {user.role !== "USER" && (
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                applyFilters({ status: e.target.value });
              }}
              className="h-8 rounded-[4px] border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Statuses</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          )}

          {/* Bonus Type */}
          <select
            value={bonusType}
            onChange={(e) => {
              setBonusType(e.target.value);
              applyFilters({ bonusType: e.target.value });
            }}
            className="h-8 rounded-[4px] border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Types</option>
            <option value="PERFORMANCE">PERFORMANCE</option>
            <option value="SPOT">SPOT</option>
            <option value="REFERRAL">REFERRAL</option>
            <option value="FESTIVE">FESTIVE</option>
            <option value="RETENTION">RETENTION</option>
            <option value="PROJECT">PROJECT</option>
            <option value="MILESTONE">MILESTONE</option>
            <option value="OTHER">OTHER</option>
          </select>

          {(search || status || bonusType) && (
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
          Showing {bonusesData.rows.length} of {bonusesData.total} bonuses
        </div>
      </div>

      {/* Bonuses Table */}
      {bonusesData.rows.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No bonus records found"
          description="Adjust your search criteria or award a new bonus nomination."
          action={
            isManagement ? (
              <Button
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Award First Bonus
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-[8px] border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {isAdmin && (
                    <th className="w-8 p-3 text-center">
                      <Checkbox
                        checked={
                          selectedIds.length > 0 &&
                          selectedIds.length ===
                            bonusesData.rows.filter(
                              (b) => b.status === "PENDING_APPROVAL"
                            ).length
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedIds(
                              bonusesData.rows
                                .filter((b) => b.status === "PENDING_APPROVAL")
                                .map((b) => b.id)
                            );
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </th>
                  )}
                  <th className="w-8 p-3"></th>
                  <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                    Recipient
                  </th>
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
                    Date
                  </th>
                  {isAdmin && (
                    <th className="p-3 text-right font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bonusesData.rows.map((b) => {
                  const isExpanded = expandedBonusId === b.id;
                  const isSelected = selectedIds.includes(b.id);

                  return (
                    <React.Fragment key={b.id}>
                      <tr
                        className={`transition-colors hover:bg-muted/40 ${
                          isSelected ? "bg-muted/20" : ""
                        }`}
                      >
                        {isAdmin && (
                          <td className="p-3 text-center">
                            {b.status === "PENDING_APPROVAL" ? (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedIds([...selectedIds, b.id]);
                                  } else {
                                    setSelectedIds(
                                      selectedIds.filter((id) => id !== b.id)
                                    );
                                  }
                                }}
                              />
                            ) : null}
                          </td>
                        )}
                        <td
                          className="p-3 text-center cursor-pointer text-muted-foreground"
                          onClick={() =>
                            setExpandedBonusId(isExpanded ? null : b.id)
                          }
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </td>
                        <td className="p-3">
                          <Link
                            href={`/employees/${b.employeeId}?tab=bonus`}
                            className="font-medium text-foreground hover:text-indigo-600 hover:underline"
                          >
                            {b.employeeName}
                          </Link>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {b.employeeCode} {b.departmentName ? `· ${b.departmentName}` : ""}
                          </div>
                        </td>
                        <td className="p-3 font-bold text-foreground text-sm tabular-nums font-mono-num whitespace-nowrap">
                          <MoneyCell amount={b.amount} />
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{b.bonusType}</Badge>
                        </td>
                        <td
                          className="p-3 font-normal text-foreground max-w-md cursor-pointer"
                          onClick={() =>
                            setExpandedBonusId(isExpanded ? null : b.id)
                          }
                        >
                          <span className={isExpanded ? "" : "line-clamp-2"}>
                            {b.reason}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="p-3 text-muted-foreground whitespace-nowrap">
                          {formatDateOnly(b.createdAt)}
                        </td>

                        {/* Admin Inline Workflow Actions */}
                        {isAdmin && (
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {b.status === "PENDING_APPROVAL" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(b.id)}
                                    disabled={isProcessing}
                                    className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Approve</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openRejectModal(b)}
                                    disabled={isProcessing}
                                    className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1"
                                  >
                                    <XCircle className="h-3 w-3" />
                                    <span>Reject</span>
                                  </Button>
                                </>
                              )}
                              {b.status === "APPROVED" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkPaid(b.id)}
                                  disabled={isProcessing}
                                  className="h-7 px-2 text-xs gap-1 text-indigo-600 hover:text-indigo-700"
                                >
                                  <CreditCard className="h-3 w-3" />
                                  <span>Mark Paid</span>
                                </Button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-muted/10">
                          <td colSpan={isAdmin ? 9 : 8} className="p-4 pl-12">
                            <div className="space-y-3">
                              <div>
                                <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  Full Justification Reason
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
                                  <strong className="text-foreground">
                                    {b.payoutDate ? formatDateOnly(b.payoutDate) : "Pending"}
                                  </strong>
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
        </div>
      )}

      {/* Bonus Create Modal */}
      {isManagement && (
        <BonusModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          employees={employees}
          preselectedEmployeeId={preselectedEmployeeId}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* Rejection Reason Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Bonus Nomination</DialogTitle>
            <DialogDescription>
              Please state why this bonus is being rejected. This explanation is recorded in the audit log and shared with the nominator.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="rejectionReason">Mandatory Rejection Reason (Min 10 characters)</Label>
            <Textarea
              id="rejectionReason"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Department budget threshold exceeded for this quarter. Resubmit in next review cycle."
              className="text-xs"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Must be at least 10 characters</span>
              <span>{rejectionReason.length} chars</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectModalOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRejectSubmit}
              disabled={isProcessing || rejectionReason.trim().length < 10}
              className="gap-1.5"
            >
              {isProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Confirm Rejection</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
