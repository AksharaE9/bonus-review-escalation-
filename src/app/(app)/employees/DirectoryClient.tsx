"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/app/StatusBadge";
import { EmptyState } from "@/components/app/EmptyState";
import {
  LayoutGrid,
  Table as TableIcon,
  Search,
  Users,
  RotateCcw,
  ExternalLink,
  Building,
} from "lucide-react";
import type { PublicUser, PaginatedResult, SessionUser } from "@/types";

interface DirectoryClientProps {
  user: SessionUser;
  usersData: PaginatedResult<PublicUser>;
  departments: Array<{ id: string; name: string; code: string }>;
  filters: {
    search: string;
    departmentId: string;
    role: string;
    status: string;
  };
}

export function DirectoryClient({
  user,
  usersData,
  departments,
  filters,
}: DirectoryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [search, setSearch] = useState(filters.search);
  const [departmentId, setDepartmentId] = useState(filters.departmentId);
  const [role, setRole] = useState(filters.role);
  const [status, setStatus] = useState(filters.status);

  useEffect(() => {
    const savedView = localStorage.getItem("pulse_directory_view");
    if (savedView === "cards" || savedView === "table") {
      setViewMode(savedView);
    }
  }, []);

  const changeViewMode = (mode: "cards" | "table") => {
    setViewMode(mode);
    localStorage.setItem("pulse_directory_view", mode);
  };

  const applyFilters = (overrides: {
    search?: string;
    departmentId?: string;
    role?: string;
    status?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page"); // Reset pagination

    const nextSearch = overrides.search !== undefined ? overrides.search : search;
    const nextDept = overrides.departmentId !== undefined ? overrides.departmentId : departmentId;
    const nextRole = overrides.role !== undefined ? overrides.role : role;
    const nextStatus = overrides.status !== undefined ? overrides.status : status;

    if (nextSearch) params.set("search", nextSearch);
    else params.delete("search");

    if (nextDept) params.set("departmentId", nextDept);
    else params.delete("departmentId");

    if (nextRole) params.set("role", nextRole);
    else params.delete("role");

    if (nextStatus) params.set("status", nextStatus);
    else params.delete("status");

    router.push(`/employees?${params.toString()}`);
  };

  const resetFilters = () => {
    setSearch("");
    setDepartmentId("");
    setRole("");
    setStatus("");
    router.push("/employees");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title={user.role === "LEAD" ? "My Team Directory" : "Employee Directory"}
        description={
          user.role === "LEAD"
            ? "Manage and monitor bonuses, reviews, and escalations for your department and direct reports."
            : "Enterprise directory of team members, departments, performance histories, and operational records."
        }
        actions={
          <div className="flex items-center gap-2">
            {user.role === "ADMIN" && (
              <Link href="/settings/users">
                <Button
                  size="sm"
                  className="h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Manage Users & Approvals</span>
                </Button>
              </Link>
            )}
            <div className="flex items-center gap-1 rounded-[6px] border border-border bg-card p-0.5">
              <button
                onClick={() => changeViewMode("cards")}
                className={`flex h-7 items-center gap-1.5 rounded-[4px] px-2.5 text-xs font-medium transition-subtle ${
                  viewMode === "cards"
                    ? "bg-muted text-foreground shadow-none"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Cards</span>
              </button>
              <button
                onClick={() => changeViewMode("table")}
                className={`flex h-7 items-center gap-1.5 rounded-[4px] px-2.5 text-xs font-medium transition-subtle ${
                  viewMode === "table"
                    ? "bg-muted text-foreground shadow-none"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>
        }
      />

      {/* Toolbar & Filters */}
      <div className="flex flex-col gap-2 rounded-[8px] border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters({ search })}
              placeholder="Search by name, code, or role..."
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* Department Filter (Admin only) */}
          {user.role === "ADMIN" && (
            <select
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                applyFilters({ departmentId: e.target.value });
              }}
              className="h-8 rounded-[4px] border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          )}

          {/* Role Filter */}
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              applyFilters({ role: e.target.value });
            }}
            className="h-8 rounded-[4px] border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="LEAD">LEAD</option>
            <option value="USER">USER</option>
          </select>

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
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>

          {(search || departmentId || role || status) && (
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
          Showing {usersData.rows.length} of {usersData.total} members
        </div>
      </div>

      {/* Main Content Area */}
      {usersData.rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees found"
          description="Try broadening your search query or resetting filters to display all team members."
          action={
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset Filters
            </Button>
          }
        />
      ) : viewMode === "cards" ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {usersData.rows.map((emp) => (
            <Link
              key={emp.id}
              href={`/employees/${emp.id}`}
              className="group relative flex flex-col justify-between rounded-[8px] border border-border bg-card p-4 transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-zinc-400 dark:hover:border-zinc-700"
            >
              <div>
                {/* Avatar & Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                      {emp.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {emp.fullName}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {emp.designation || "Team Member"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {emp.employeeCode}
                  </Badge>
                </div>

                {/* Dept & Role Info */}
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium">
                    <Building className="h-3 w-3" />
                    {emp.departmentName || "General"}
                  </span>
                  <span>•</span>
                  <span>{emp.role}</span>
                </div>
              </div>

              {/* Card Footer Status */}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <StatusBadge status={emp.status} />
                <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 opacity-80 group-hover:opacity-100">
                  View Profile
                  <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-hidden rounded-[8px] border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-xs">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                    Code
                  </th>
                  <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                    Department
                  </th>
                  <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                    Designation
                  </th>
                  <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th className="p-3 text-left font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="p-3 text-right font-medium text-muted-foreground uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usersData.rows.map((emp) => (
                  <tr
                    key={emp.id}
                    className="transition-colors hover:bg-muted/40"
                  >
                    <td className="p-3">
                      <Link
                        href={`/employees/${emp.id}`}
                        className="font-medium text-foreground hover:text-indigo-600 hover:underline"
                      >
                        {emp.fullName}
                      </Link>
                      <div className="text-[11px] text-muted-foreground">
                        {emp.email}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-muted-foreground">
                      {emp.employeeCode}
                    </td>
                    <td className="p-3 text-foreground">
                      {emp.departmentName || "—"}
                    </td>
                    <td className="p-3 text-foreground">
                      {emp.designation || "—"}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px]">
                        {emp.role}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className="p-3 text-right">
                      <Link href={`/employees/${emp.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          Profile
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
