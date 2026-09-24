"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AuditDiff } from "@/components/app/AuditDiff";
import { formatDateTime, formatRelativeTime } from "@/lib/dates";
import {
  Download,
  ChevronDown,
  ChevronRight,
  Search,
  RotateCcw,
} from "lucide-react";
import type { AuditLogRow } from "@/server/repos/audit.repo";
import { toast } from "sonner";

interface AuditClientProps {
  initialData: {
    rows: AuditLogRow[];
    nextCursor: number | null;
    total: number;
  };
  currentFilters: {
    action: string;
    entityType: string;
    search: string;
  };
}

export function AuditClient({ initialData, currentFilters }: AuditClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [search, setSearch] = useState(currentFilters.search);
  const [action, setAction] = useState(currentFilters.action);
  const [entityType, setEntityType] = useState(currentFilters.entityType);
  const [isExporting, setIsExporting] = useState(false);

  const applyFilters = (newFilters: { action?: string; entityType?: string; search?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("cursorId"); // Reset pagination

    const nextAction = newFilters.action !== undefined ? newFilters.action : action;
    const nextEntity = newFilters.entityType !== undefined ? newFilters.entityType : entityType;
    const nextSearch = newFilters.search !== undefined ? newFilters.search : search;

    if (nextAction) params.set("action", nextAction);
    else params.delete("action");

    if (nextEntity) params.set("entityType", nextEntity);
    else params.delete("entityType");

    if (nextSearch) params.set("search", nextSearch);
    else params.delete("search");

    router.push(`/audit?${params.toString()}`);
  };

  const resetFilters = () => {
    setSearch("");
    setAction("");
    setEntityType("");
    router.push("/audit");
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      toast.info("Preparing audit log export CSV...");
      const res = await fetch("/api/export/audit");
      if (!res.ok) throw new Error("Export request failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pulse-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Audit log CSV exported successfully (audited).");
    } catch (err: unknown) {
      toast.error(`Export failed: ${(err as Error).message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const renderActionBadge = (act: string) => {
    switch (act) {
      case "CREATE":
        return <Badge variant="success">CREATE</Badge>;
      case "STATUS_CHANGE":
        return <Badge variant="warning">STATUS</Badge>;
      case "UPDATE":
        return <Badge variant="info">UPDATE</Badge>;
      case "SOFT_DELETE":
        return <Badge variant="danger">DELETE</Badge>;
      case "RESTORE":
        return <Badge variant="success">RESTORE</Badge>;
      case "ROLE_CHANGE":
        return <Badge variant="danger">ROLE</Badge>;
      case "LOGIN":
        return <Badge variant="default">LOGIN</Badge>;
      case "LOGIN_FAILED":
        return <Badge variant="danger">LOGIN FAIL</Badge>;
      case "EXPORT":
        return <Badge variant="info">EXPORT</Badge>;
      default:
        return <Badge variant="outline">{act}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Audit Log"
        description="Append-only immutable record of all transactions, role changes, exports, and security events."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="gap-2"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
        }
      />

      {/* Toolbar / Filters */}
      <div className="flex flex-col gap-2 rounded-[8px] border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters({ search })}
              placeholder="Search by label or email..."
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* Action Filter */}
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              applyFilters({ action: e.target.value });
            }}
            className="h-8 rounded-[4px] border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="STATUS_CHANGE">STATUS CHANGE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="SOFT_DELETE">SOFT DELETE</option>
            <option value="RESTORE">RESTORE</option>
            <option value="ROLE_CHANGE">ROLE CHANGE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGIN_FAILED">LOGIN FAILED</option>
            <option value="EXPORT">EXPORT</option>
          </select>

          {/* Entity Filter */}
          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              applyFilters({ entityType: e.target.value });
            }}
            className="h-8 rounded-[4px] border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Entity Types</option>
            <option value="BONUS">BONUS</option>
            <option value="REVIEW">REVIEW</option>
            <option value="ESCALATION">ESCALATION</option>
            <option value="USER">USER</option>
            <option value="AUTH">AUTH</option>
            <option value="AUDIT_LOG">AUDIT LOG</option>
          </select>

          {(action || entityType || search) && (
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
          Showing {initialData.rows.length} of {initialData.total} audit records
        </div>
      </div>

      {/* Dense Audit Table */}
      <div className="overflow-hidden rounded-[8px] border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-xs">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="w-8 p-2.5"></th>
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
                  Entity Type
                </th>
                <th className="p-2.5 text-left font-medium text-muted-foreground uppercase tracking-wider">
                  Entity Label / Description
                </th>
                <th className="p-2.5 text-left font-medium text-muted-foreground uppercase tracking-wider">
                  IP / Request
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initialData.rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-muted-foreground">
                    No audit records match the selected filters.
                  </td>
                </tr>
              ) : (
                initialData.rows.map((row) => {
                  const isExpanded = expandedRowId === row.id;
                  return (
                    <React.Fragment key={row.id}>
                      <tr
                        onClick={() =>
                          setExpandedRowId(isExpanded ? null : row.id)
                        }
                        className="cursor-pointer transition-colors hover:bg-muted/40 data-[state=expanded]:bg-muted/20"
                        data-state={isExpanded ? "expanded" : undefined}
                      >
                        <td className="p-2.5 text-center text-muted-foreground">
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </td>
                        <td className="p-2.5 whitespace-nowrap text-foreground">
                          <span
                            title={formatDateTime(row.createdAt)}
                            className="underline decoration-dotted underline-offset-2"
                          >
                            {formatRelativeTime(row.createdAt)}
                          </span>
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground">
                              {row.actorName || row.actorEmail || "System"}
                            </span>
                            {row.actorRole && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0">
                                {row.actorRole}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          {renderActionBadge(row.action)}
                        </td>
                        <td className="p-2.5 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                          {row.entityType}
                        </td>
                        <td className="p-2.5 font-medium text-foreground max-w-sm truncate">
                          {row.entityLabel || row.entityId || "—"}
                        </td>
                        <td className="p-2.5 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                          {row.ipAddress || "—"}
                        </td>
                      </tr>

                      {/* Expanded JSON Diff Row */}
                      {isExpanded && (
                        <tr className="bg-muted/10">
                          <td colSpan={7} className="p-4 pl-10">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span>
                                  Log ID: <strong className="font-mono">{row.id}</strong> | Request ID:{" "}
                                  <strong className="font-mono">{row.requestId || "—"}</strong> | User Agent:{" "}
                                  <span className="font-mono text-[10px]">{row.userAgent || "—"}</span>
                                </span>
                              </div>
                              <AuditDiff
                                before={row.before}
                                after={row.after}
                                changedFields={row.changedFields}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Cursor Pagination Bar */}
        {initialData.nextCursor && (
          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-2 text-xs">
            <span className="text-muted-foreground">
              Showing 50 records per page
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("cursorId", String(initialData.nextCursor));
                router.push(`/audit?${params.toString()}`);
              }}
            >
              Load Next Page →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
