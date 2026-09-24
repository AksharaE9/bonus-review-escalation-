"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Award,
  FileCheck2,
  AlertOctagon,
  ShieldCheck,
  UserCog,
  Settings,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role, SessionUser } from "@/types";
import { ROLE_LANDING } from "@/lib/auth-routes";
import { signOut } from "next-auth/react";
import { getPendingRegistrationsCountAction } from "@/server/actions/user";

interface SidebarProps {
  user: SessionUser;
  previewRole?: Role | null;
}

export function Sidebar({ user, previewRole }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("pulse_sidebar_collapsed");
    if (saved !== null) {
      setCollapsed(saved === "true");
    }
  }, []);

  // Poll for pending user approvals in real-time
  useEffect(() => {
    if (user.role !== "ADMIN") return;

    const checkPending = async () => {
      try {
        const res = await getPendingRegistrationsCountAction();
        setPendingApprovalsCount(res.count);
      } catch {
        // Silent catch
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, [user.role, pathname]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("pulse_sidebar_collapsed", String(next));
  };

  const activeRole = previewRole || user.role;
  const homeHref = ROLE_LANDING[activeRole] || "/dashboard";

  const getNavItems = () => {
    switch (activeRole) {
      case "ADMIN":
        return [
          { label: "Dashboard", href: homeHref, icon: LayoutDashboard },
          { label: "Employees", href: "/employees", icon: Users },
          { label: "Bonuses", href: "/bonuses", icon: Award },
          { label: "Reviews", href: "/reviews", icon: FileCheck2 },
          { label: "Escalations", href: "/escalations", icon: AlertOctagon },
          { label: "Audit Log", href: "/audit", icon: ShieldCheck },
          { label: "Users & Roles", href: "/settings/users", icon: UserCog },
          { label: "Settings", href: "/settings", icon: Settings },
        ];
      case "LEAD":
        return [
          { label: "Dashboard", href: homeHref, icon: LayoutDashboard },
          { label: "My Team", href: "/employees", icon: Users },
          { label: "Bonuses", href: "/bonuses", icon: Award },
          { label: "Reviews", href: "/reviews", icon: FileCheck2 },
          { label: "Escalations", href: "/escalations", icon: AlertOctagon },
        ];
      case "USER":
      default:
        return [
          { label: "Dashboard", href: homeHref, icon: LayoutDashboard },
          { label: "My Bonuses", href: "/bonuses", icon: Award },
          { label: "My Reviews", href: "/reviews", icon: FileCheck2 },
          { label: "My Escalations", href: "/escalations", icon: AlertOctagon },
          {
            label: "Raise a Complaint",
            href: "/escalations/new",
            icon: PlusCircle,
            highlight: true,
          },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border bg-card transition-all duration-200 ease-out select-none",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-3.5">
        <Link href={homeHref} className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-indigo-600 font-bold text-white text-xs">
            P
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-foreground">
                Pulse
              </span>
              <span className="text-[10px] text-muted-foreground -mt-0.5">
                People Operations
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={toggleCollapsed}
          className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href === homeHref && pathname === "/dashboard") ||
            (item.href !== homeHref && item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-xs font-medium transition-subtle",
                isActive
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                item.highlight &&
                  !isActive &&
                  "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {!collapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}
              {item.href === "/settings/users" && pendingApprovalsCount > 0 && (
                <span
                  className={cn(
                    "flex items-center justify-center rounded-full bg-amber-500 text-white font-bold font-mono animate-pulse",
                    collapsed ? "h-2 w-2 absolute top-1 right-1" : "h-4 min-w-4 px-1 text-[10px]"
                  )}
                >
                  {!collapsed && pendingApprovalsCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom User Area */}
      <div className="border-t border-border p-2">
        <div
          className={cn(
            "flex items-center gap-2 rounded-[6px] p-1.5",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {user.fullName ? user.fullName.charAt(0) : "U"}
            </div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-xs font-medium text-foreground">
                  {user.fullName}
                </span>
                <span className="truncate text-[10px] text-muted-foreground">
                  {user.email}
                </span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => signOut({ callbackUrl: "/sign-in" })}
              className="flex h-7 w-7 items-center justify-center rounded-[4px] text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
