"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Shield,
  Eye,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Role, SessionUser } from "@/types";
import { signOut } from "next-auth/react";

interface TopbarProps {
  user: SessionUser;
  onOpenCommandPalette?: () => void;
  previewRole?: Role | null;
  onSelectPreviewRole?: (role: Role | null) => void;
}

export function Topbar({
  user,
  onOpenCommandPalette,
  previewRole,
  onSelectPreviewRole,
}: TopbarProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Enforce light theme as default
    document.documentElement.classList.remove("dark");
    setIsDark(false);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove("dark");
      setIsDark(false);
      localStorage.setItem("pulse_theme", "light");
    } else {
      root.classList.add("dark");
      setIsDark(true);
      localStorage.setItem("pulse_theme", "dark");
    }
  };

  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return "Dashboard";

    const mapped = parts.map((p) => {
      if (p === "dashboard") return "Dashboard";
      if (p === "employees") return "Employees";
      if (p === "bonuses") return "Bonuses";
      if (p === "reviews") return "Reviews";
      if (p === "escalations") return "Escalations";
      if (p === "audit") return "Audit Log";
      if (p === "settings") return "Settings";
      if (p === "new") return "New";
      if (p.startsWith("ESC-")) return p;
      return p;
    });

    return mapped.join(" / ");
  };

  return (
    <header className="flex h-14 w-full items-center justify-between border-b border-border bg-card/60 px-6 backdrop-blur-sm">
      {/* Left Breadcrumbs */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground capitalize">
          {getBreadcrumbs()}
        </span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex h-8 items-center gap-2 rounded-[6px] border border-border bg-background px-2.5 text-xs text-muted-foreground hover:border-zinc-400 hover:text-foreground transition-subtle"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="pointer-events-none hidden h-4 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-[6px] border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-subtle"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600" />
        </button>

        {/* Role Badge */}
        <Badge
          variant={
            user.role === "ADMIN"
              ? "default"
              : user.role === "LEAD"
              ? "info"
              : "secondary"
          }
          className="text-[10px] tracking-wide"
        >
          {previewRole ? `PREVIEW: ${previewRole}` : user.role}
        </Badge>

        {/* Avatar Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold text-foreground hover:ring-2 hover:ring-indigo-500/20 transition-subtle">
              {user.fullName ? user.fullName.charAt(0) : "U"}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-0.5">
                <p className="text-xs font-medium text-foreground">
                  {user.fullName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Theme Toggle */}
            <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
              {isDark ? (
                <>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark Mode</span>
                </>
              )}
            </DropdownMenuItem>

            {/* Admin "View As Role" feature */}
            {user.role === "ADMIN" && onSelectPreviewRole && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  View As Role (Preview)
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => onSelectPreviewRole(null)}
                  className="cursor-pointer"
                >
                  <Shield className="mr-2 h-3.5 w-3.5" />
                  <span>Admin (Real View)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onSelectPreviewRole("LEAD")}
                  className="cursor-pointer"
                >
                  <Eye className="mr-2 h-3.5 w-3.5" />
                  <span>Lead View</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onSelectPreviewRole("USER")}
                  className="cursor-pointer"
                >
                  <UserIcon className="mr-2 h-3.5 w-3.5" />
                  <span>Employee View</span>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/sign-in" })}
              className="cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
