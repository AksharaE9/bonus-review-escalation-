"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SessionUser, Role, UserStatus } from "@/types";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  createUserAction,
  updateUserRoleAction,
  softDeleteUserAction,
  approveUserAction,
  rejectUserAction,
  getUsersRealtimeAction,
} from "@/server/actions/user";
import { formatDateTime } from "@/lib/dates";
import { toast } from "sonner";
import {
  UserPlus,
  Search,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Users,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";

export interface UserRow {
  id: string;
  employeeCode: string;
  email: string;
  fullName: string;
  role: Role;
  departmentId: string | null;
  departmentName: string | null;
  designation: string | null;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
}

interface UsersClientProps {
  currentUser: SessionUser;
  users: UserRow[];
  departments: Array<{ id: string; name: string }>;
}

export function UsersClient({ currentUser, users: initialUsers, departments }: UsersClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Local state for users and real-time syncing
  const [usersList, setUsersList] = useState<UserRow[]>(initialUsers);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);

  const [activeTab, setActiveTab] = useState<"active" | "pending">("active");
  const [search, setSearch] = useState("");

  // Provision User Modal
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<Role>("USER");
  const [newDeptId, setNewDeptId] = useState<string>("none");
  const [newDesignation, setNewDesignation] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCustomPassword, setNewCustomPassword] = useState("");

  // Created User Success Modal (Credential Presentation)
  const [createdUserResult, setCreatedUserResult] = useState<{
    fullName: string;
    email: string;
    employeeCode: string;
    temporaryPassword: string;
    role: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Role Change Modal
  const [roleChangeTarget, setRoleChangeTarget] = useState<UserRow | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<Role>("USER");

  // Approve Registration Modal
  const [approveTarget, setApproveTarget] = useState<UserRow | null>(null);
  const [approveRole, setApproveRole] = useState<Role>("USER");
  const [approveDeptId, setApproveDeptId] = useState<string>("none");
  const [approveDesignation, setApproveDesignation] = useState("");

  // Real-time synchronization fetcher
  const syncUsers = useCallback(async (showToast = false) => {
    try {
      setIsSyncing(true);
      const res = await getUsersRealtimeAction();
      setUsersList(res.users as UserRow[]);
      setLastSyncedAt(new Date());
      if (showToast) {
        toast.success("Users synchronized with live database");
      }
    } catch {
      // Background sync silently catches transient issues
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Poll for real-time changes every 4 seconds when no modal is open
  useEffect(() => {
    const isModalOpen = Boolean(
      createUserOpen || roleChangeTarget || approveTarget || createdUserResult
    );
    if (isModalOpen) return;

    const interval = setInterval(() => {
      syncUsers(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [createUserOpen, roleChangeTarget, approveTarget, createdUserResult, syncUsers]);

  const pendingUsers = usersList.filter((u) => u.status === "INACTIVE");
  const activeUsers = usersList.filter((u) => u.status === "ACTIVE" || u.status === "SUSPENDED");

  const displayedUsers = activeTab === "pending" ? pendingUsers : activeUsers;

  const filteredUsers = displayedUsers.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.employeeCode.toLowerCase().includes(q) ||
      (u.departmentName && u.departmentName.toLowerCase().includes(q)) ||
      (u.designation && u.designation.toLowerCase().includes(q))
    );
  });

  const handleCreateUser = () => {
    if (!newEmail.trim() || !newName.trim()) {
      toast.error("Full Name and Email are required");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createUserAction({
          email: newEmail.trim(),
          fullName: newName.trim(),
          role: newRole,
          departmentId: newDeptId === "none" ? null : newDeptId,
          designation: newDesignation.trim() || undefined,
          phone: newPhone.trim() || undefined,
          password: newCustomPassword.trim() || undefined,
        });

        // Present credentials in modal
        setCreatedUserResult({
          fullName: res.fullName,
          email: res.email,
          employeeCode: res.employeeCode,
          temporaryPassword: res.temporaryPassword,
          role: res.role,
        });

        setCreateUserOpen(false);
        setNewEmail("");
        setNewName("");
        setNewDesignation("");
        setNewPhone("");
        setNewCustomPassword("");
        await syncUsers(false);
        router.refresh();
      } catch (err: unknown) {
        toast.error((err as Error).message || "Failed to provision member");
      }
    });
  };

  const handleConfirmRoleChange = () => {
    if (!roleChangeTarget) return;
    startTransition(async () => {
      try {
        await updateUserRoleAction(roleChangeTarget.id, selectedNewRole);
        toast.success(`Role updated for ${roleChangeTarget.fullName} to ${selectedNewRole}`);
        setRoleChangeTarget(null);
        await syncUsers(false);
        router.refresh();
      } catch (err: unknown) {
        toast.error((err as Error).message || "Failed to change role");
      }
    });
  };

  const handleDeactivate = (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate ${name}?`)) {
      return;
    }
    startTransition(async () => {
      try {
        await softDeleteUserAction(userId);
        toast.success(`${name} has been deactivated.`);
        await syncUsers(false);
        router.refresh();
      } catch (err: unknown) {
        toast.error((err as Error).message || "Failed to deactivate member");
      }
    });
  };

  const openApproveModal = (u: UserRow) => {
    setApproveTarget(u);
    setApproveRole(u.role || "USER");
    setApproveDeptId(u.departmentId || "none");
    setApproveDesignation(u.designation || "");
  };

  const handleApproveRegistration = () => {
    if (!approveTarget) return;
    startTransition(async () => {
      try {
        await approveUserAction({
          userId: approveTarget.id,
          role: approveRole,
          departmentId: approveDeptId === "none" ? null : approveDeptId,
          designation: approveDesignation.trim() || undefined,
        });
        toast.success(`Account approved and activated for ${approveTarget.fullName}`);
        setApproveTarget(null);
        await syncUsers(false);
        router.refresh();
      } catch (err: unknown) {
        toast.error((err as Error).message || "Failed to approve registration");
      }
    });
  };

  const handleRejectRegistration = (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to reject and remove registration request from ${name}?`)) {
      return;
    }
    startTransition(async () => {
      try {
        await rejectUserAction(userId);
        toast.info(`Registration request from ${name} rejected and removed.`);
        await syncUsers(false);
        router.refresh();
      } catch (err: unknown) {
        toast.error((err as Error).message || "Failed to reject registration");
      }
    });
  };

  const copyCredentialsToClipboard = () => {
    if (!createdUserResult) return;
    const text = `Pulse Member Credentials:\nName: ${createdUserResult.fullName}\nEmail: ${createdUserResult.email}\nEmployee Code: ${createdUserResult.employeeCode}\nRole: ${createdUserResult.role}\nTemporary Password: ${createdUserResult.temporaryPassword}\nLogin: ${window.location.origin}/sign-in`;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    toast.success("Credentials copied to clipboard");
    setTimeout(() => setCopiedKey(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        title="User & Role Governance"
        description="Review incoming registration requests, provision corporate employee accounts, and manage RBAC roles in real-time."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncUsers(true)}
              disabled={isSyncing}
              className="text-xs h-8 gap-1.5 border-zinc-200 dark:border-zinc-800"
              title="Manually sync users with database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${isSyncing ? "animate-spin text-indigo-600" : ""}`} />
              <span className="hidden sm:inline">Sync Now</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setCreateUserOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Provision New Member
            </Button>
          </div>
        }
      />

      {/* Real-time Status Banner */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-zinc-600 dark:text-zinc-300 font-medium">
            Real-Time Live Sync Active
          </span>
          <span className="text-[10px] text-zinc-400 hidden sm:inline">
            (Auto-polling every 4s)
          </span>
        </div>
        <div className="text-[11px] text-zinc-400 font-mono">
          Last synced: {lastSyncedAt.toLocaleTimeString()}
        </div>
      </div>

      {/* Tabs & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "active"
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Active Directory</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-800 font-mono">
              {activeUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "pending"
                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Approvals</span>
            {pendingUsers.length > 0 ? (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-mono font-bold animate-pulse">
                {pendingUsers.length}
              </span>
            ) : (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-400 font-mono">
                0
              </span>
            )}
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
          <Input
            placeholder="Search by name, code, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-8 w-full"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
            <TableRow className="border-b border-zinc-200 dark:border-zinc-800">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                Member Profile
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                Assigned Role
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                Department & Title
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                {activeTab === "pending" ? "Registration Date" : "Last Active"}
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-xs text-zinc-400">
                  {activeTab === "pending"
                    ? "✨ All set! There are no pending registration requests awaiting approval."
                    : "No matching members found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow
                  key={u.id}
                  className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                        {u.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                          {u.fullName}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          {u.employeeCode} · {u.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold font-mono border ${
                        u.role === "ADMIN"
                          ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                          : u.role === "LEAD"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
                          : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">
                    <div className="font-medium text-zinc-800 dark:text-zinc-200">{u.departmentName || "Unassigned"}</div>
                    <div className="text-[11px] text-zinc-500">{u.designation || "Staff Member"}</div>
                  </TableCell>
                  <TableCell>
                    {u.status === "ACTIVE" ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Active
                      </span>
                    ) : u.status === "INACTIVE" ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                        Pending Approval
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-600">
                        Suspended
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-zinc-500">
                    {activeTab === "pending"
                      ? formatDateTime(u.createdAt)
                      : u.lastLoginAt
                      ? formatDateTime(u.lastLoginAt)
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    {activeTab === "pending" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-xs"
                          onClick={() => openApproveModal(u)}
                          disabled={isPending}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/50"
                          onClick={() => handleRejectRegistration(u.id, u.fullName)}
                          disabled={isPending}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2.5"
                          onClick={() => {
                            setRoleChangeTarget(u);
                            setSelectedNewRole(u.role);
                          }}
                        >
                          Change Role
                        </Button>
                        {u.id !== currentUser.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            onClick={() => handleDeactivate(u.id, u.fullName)}
                            disabled={isPending}
                            title="Deactivate Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Approve Registration Modal */}
      <Dialog open={Boolean(approveTarget)} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Approve Registration & Assign Role
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Activate member profile for <strong className="font-semibold text-zinc-800 dark:text-zinc-200">{approveTarget?.fullName}</strong> ({approveTarget?.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Assign Role *</Label>
              <Select value={approveRole} onValueChange={(v: string) => setApproveRole(v as Role)}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER" className="text-xs">USER (Employee - view own records)</SelectItem>
                  <SelectItem value="LEAD" className="text-xs">LEAD (Team Lead - department scope)</SelectItem>
                  <SelectItem value="ADMIN" className="text-xs">ADMIN (Executive - full org governance)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Department</Label>
              <Select value={approveDeptId} onValueChange={setApproveDeptId}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">-- No Department --</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="text-xs">
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Job Title / Designation</Label>
              <Input
                placeholder="e.g. Senior Software Engineer"
                value={approveDesignation}
                onChange={(e) => setApproveDesignation(e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setApproveTarget(null)}
              disabled={isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApproveRegistration}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Activate Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Provision New Member Modal */}
      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              Provision New Member
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Directly create and activate a new member profile with instant console access.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Full Name *</Label>
              <Input
                placeholder="e.g. Aditi Sharma"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Email Address *</Label>
              <Input
                type="email"
                placeholder="name@pulse.local"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Role</Label>
                <Select value={newRole} onValueChange={(v: string) => setNewRole(v as Role)}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER" className="text-xs">USER (Employee)</SelectItem>
                    <SelectItem value="LEAD" className="text-xs">LEAD (Team Lead)</SelectItem>
                    <SelectItem value="ADMIN" className="text-xs">ADMIN (Executive)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Department</Label>
                <Select value={newDeptId} onValueChange={setNewDeptId}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">-- None --</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-xs">
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Job Title</Label>
                <Input
                  placeholder="e.g. Lead QA Engineer"
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Phone</Label>
                <Input
                  placeholder="+91 98765 43210"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Custom Password (Optional)
              </Label>
              <Input
                type="text"
                placeholder="Leave blank for auto-generated password"
                value={newCustomPassword}
                onChange={(e) => setNewCustomPassword(e.target.value)}
                className="text-xs h-8 font-mono"
              />
              <p className="text-[10px] text-zinc-400">
                If blank, a secure temporary password (e.g. Pulse@1003) will be created automatically.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateUserOpen(false)}
              disabled={isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCreateUser}
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shadow-sm"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Provision Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Created Member Credential Confirmation Modal */}
      <Dialog open={Boolean(createdUserResult)} onOpenChange={(open) => !open && setCreatedUserResult(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Member Successfully Created
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Account has been provisioned and activated. Share these login credentials with the member.
            </DialogDescription>
          </DialogHeader>

          {createdUserResult && (
            <div className="space-y-3 py-2">
              <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Full Name:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{createdUserResult.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Employee Code:</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{createdUserResult.employeeCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Login Email:</span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-100">{createdUserResult.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Assigned Role:</span>
                  <span className="font-mono font-semibold text-indigo-600">{createdUserResult.role}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500">Temporary Password:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                    {createdUserResult.temporaryPassword}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyCredentialsToClipboard}
              className="text-xs gap-1.5"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey ? "Copied!" : "Copy Credentials"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setCreatedUserResult(null)}
              className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white text-xs"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Confirmation Dialog */}
      <Dialog open={Boolean(roleChangeTarget)} onOpenChange={(open) => !open && setRoleChangeTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Confirm Role Reassignment
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Changing {roleChangeTarget?.fullName}&apos;s role will modify access permissions. This change will be logged in the immutable audit ledger.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Select New Role</Label>
              <Select value={selectedNewRole} onValueChange={(v: string) => setSelectedNewRole(v as Role)}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER" className="text-xs">USER (Employee - self-scope only)</SelectItem>
                  <SelectItem value="LEAD" className="text-xs">LEAD (Team Lead - department scope)</SelectItem>
                  <SelectItem value="ADMIN" className="text-xs">ADMIN (Executive - full org access + audit)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRoleChangeTarget(null)}
              disabled={isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmRoleChange}
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shadow-sm"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirm Role Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
