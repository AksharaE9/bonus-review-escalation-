"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SessionUser, PaginatedResult } from "@/types";
import { EscalationRow } from "@/server/repos/escalation.repo";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { SeverityBadge } from "@/components/app/SeverityBadge";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  escStatusEnumValues,
  escSeverityEnumValues,
  escCategoryEnumValues,
} from "@/lib/validators/escalation";
import { formatDateOnly } from "@/lib/dates";
import {
  ShieldAlert,
  Search,
  Plus,
  Download,
  CheckCircle2,
  Lock,
  EyeOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface EscalationsClientProps {
  user: SessionUser;
  data: PaginatedResult<EscalationRow>;
  currentFilters: {
    status: string;
    severity: string;
    category: string;
    origin: string;
    search: string;
    page: number;
  };
}

export function EscalationsClient({ user, data, currentFilters }: EscalationsClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(currentFilters.search);
  const [status, setStatus] = useState(currentFilters.status);
  const [severity, setSeverity] = useState(currentFilters.severity);
  const [category, setCategory] = useState(currentFilters.category);
  const [origin, setOrigin] = useState(currentFilters.origin);

  const applyFilters = (overrides?: Partial<typeof currentFilters>) => {
    const query = new URLSearchParams();
    const newSearch = overrides?.search !== undefined ? overrides.search : search;
    const newStatus = overrides?.status !== undefined ? overrides.status : status;
    const newSeverity = overrides?.severity !== undefined ? overrides.severity : severity;
    const newCategory = overrides?.category !== undefined ? overrides.category : category;
    const newOrigin = overrides?.origin !== undefined ? overrides.origin : origin;
    const newPage = overrides?.page !== undefined ? overrides.page : 1;

    if (newSearch) query.set("search", newSearch);
    if (newStatus && newStatus !== "ALL") query.set("status", newStatus);
    if (newSeverity && newSeverity !== "ALL") query.set("severity", newSeverity);
    if (newCategory && newCategory !== "ALL") query.set("category", newCategory);
    if (newOrigin && newOrigin !== "ALL") query.set("origin", newOrigin);
    if (newPage > 1) query.set("page", String(newPage));

    startTransition(() => {
      router.push(`/escalations?${query.toString()}`);
    });
  };

  const isUserRole = user.role === "USER";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={isUserRole ? "My Complaints & Grievances" : "Escalations & Grievances"}
        description={
          isUserRole
            ? "Track and manage your submitted workplace complaints and grievances."
            : "Manage disciplinary, behavioral, workplace, and performance escalations."
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1.5"
              onClick={() => {
                const params = new URLSearchParams();
                if (status) params.set("status", status);
                if (severity) params.set("severity", severity);
                window.location.href = `/api/export/escalations?${params.toString()}`;
              }}
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>

            <Link href="/escalations/new">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                {isUserRole ? "Raise a Complaint" : "New Escalation / Complaint"}
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
          <Input
            placeholder="Search ref, title, desc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters({ search, page: 1 })}
            className="pl-8 text-xs h-8"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={status || "ALL"}
          onValueChange={(val) => {
            setStatus(val);
            applyFilters({ status: val, page: 1 });
          }}
        >
          <SelectTrigger className="text-xs h-8">
            <SelectValue placeholder="Status: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">
              All Statuses
            </SelectItem>
            {escStatusEnumValues.map((st) => (
              <SelectItem key={st} value={st} className="text-xs">
                {st.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Severity Filter */}
        <Select
          value={severity || "ALL"}
          onValueChange={(val) => {
            setSeverity(val);
            applyFilters({ severity: val, page: 1 });
          }}
        >
          <SelectTrigger className="text-xs h-8">
            <SelectValue placeholder="Severity: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">
              All Severities
            </SelectItem>
            {escSeverityEnumValues.map((sev) => (
              <SelectItem key={sev} value={sev} className="text-xs">
                {sev}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select
          value={category || "ALL"}
          onValueChange={(val) => {
            setCategory(val);
            applyFilters({ category: val, page: 1 });
          }}
        >
          <SelectTrigger className="text-xs h-8">
            <SelectValue placeholder="Category: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">
              All Categories
            </SelectItem>
            {escCategoryEnumValues.map((cat) => (
              <SelectItem key={cat} value={cat} className="text-xs">
                {cat.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Origin Filter */}
        <Select
          value={origin || "ALL"}
          onValueChange={(val) => {
            setOrigin(val);
            applyFilters({ origin: val, page: 1 });
          }}
        >
          <SelectTrigger className="text-xs h-8">
            <SelectValue placeholder="Origin: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">
              All Origins
            </SelectItem>
            <SelectItem value="MANAGEMENT" className="text-xs">
              Management
            </SelectItem>
            <SelectItem value="EMPLOYEE" className="text-xs">
              Employee Complaint
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Escalations Table */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
        {data.rows.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="No escalations or complaints found"
            description="No records match your selected filter criteria."
            action={
              <Link href="/escalations/new">
                <Button size="sm" className="text-xs">
                  {isUserRole ? "Raise a Complaint" : "Create Escalation"}
                </Button>
              </Link>
            }
          />
        ) : (
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
              <TableRow className="border-b border-zinc-200 dark:border-zinc-800">
                <TableHead className="w-[120px] text-[11px] font-semibold uppercase tracking-wider">
                  Ref Code
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                  Subject & Details
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                  Severity
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                  SLA Health
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                  Assigned To
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">
                  Logged Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer transition-colors"
                  onClick={() => router.push(`/escalations/${row.refCode}`)}
                >
                  {/* Ref Code */}
                  <TableCell className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <div className="flex items-center gap-1.5">
                      <span>{row.refCode}</span>
                      {row.isConfidential && <Lock className="w-3 h-3 text-zinc-400" />}
                      {row.isAnonymous && <EyeOff className="w-3 h-3 text-zinc-400" />}
                    </div>
                  </TableCell>

                  {/* Subject & Details */}
                  <TableCell>
                    <div className="space-y-0.5 max-w-md">
                      <div className="font-medium text-xs text-zinc-900 dark:text-zinc-100 line-clamp-1">
                        {row.title}
                      </div>
                      <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                        <span className="font-medium uppercase text-[10px] tracking-wide text-zinc-600 dark:text-zinc-400">
                          {row.category.replace(/_/g, " ")}
                        </span>
                        <span>·</span>
                        <span>{row.origin === "EMPLOYEE" ? "Employee" : "Management"}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Severity */}
                  <TableCell>
                    <SeverityBadge severity={row.severity} />
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>

                  {/* SLA Health */}
                  <TableCell>
                    {row.slaBreached ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                        Breached
                      </span>
                    ) : ["RESOLVED", "CLOSED", "WITHDRAWN"].includes(row.status) ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resolved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        On Track
                      </span>
                    )}
                  </TableCell>

                  {/* Assigned To */}
                  <TableCell className="text-xs text-zinc-700 dark:text-zinc-300">
                    {row.assignedToName || <span className="text-zinc-400">Unassigned</span>}
                  </TableCell>

                  {/* Date */}
                  <TableCell className="text-xs font-mono text-zinc-500 text-right">
                    {formatDateOnly(row.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination Footer */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
            <div>
              Showing {((data.page - 1) * data.pageSize) + 1} to{" "}
              {Math.min(data.page * data.pageSize, data.total)} of {data.total} records
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={data.page <= 1}
                onClick={() => applyFilters({ page: data.page - 1 })}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="px-2 font-mono">
                {data.page} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={data.page >= data.totalPages}
                onClick={() => applyFilters({ page: data.page + 1 })}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
