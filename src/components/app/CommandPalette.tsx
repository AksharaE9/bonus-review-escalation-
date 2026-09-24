"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  LayoutDashboard,
  Users,
  Award,
  FileCheck2,
  AlertOctagon,
  ShieldCheck,
  PlusCircle,
  FileText,
} from "lucide-react";
import type { SessionUser } from "@/types";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SessionUser;
}

export function CommandPalette({
  open,
  onOpenChange,
  user,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const handleSelect = (href: string) => {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  };

  const navItems = [
    { label: "Go to Dashboard", href: "/dashboard", icon: LayoutDashboard, role: ["ADMIN", "LEAD", "USER"] },
    { label: "Go to Employee Directory", href: "/employees", icon: Users, role: ["ADMIN", "LEAD"] },
    { label: "Go to Bonuses", href: "/bonuses", icon: Award, role: ["ADMIN", "LEAD", "USER"] },
    { label: "Go to Performance Reviews", href: "/reviews", icon: FileCheck2, role: ["ADMIN", "LEAD", "USER"] },
    { label: "Go to Escalations", href: "/escalations", icon: AlertOctagon, role: ["ADMIN", "LEAD", "USER"] },
    { label: "Raise a Complaint / Grievance", href: "/escalations/new", icon: PlusCircle, role: ["ADMIN", "LEAD", "USER"] },
    { label: "Go to Audit Log", href: "/audit", icon: ShieldCheck, role: ["ADMIN"] },
    { label: "Go to Settings", href: "/settings", icon: FileText, role: ["ADMIN"] },
  ];

  const filteredNav = navItems.filter(
    (item) =>
      item.role.includes(user.role) &&
      item.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden border-border bg-popover shadow-md">
        <DialogTitle className="sr-only">Command Menu</DialogTitle>
        {/* Search input */}
        <div className="flex items-center border-b border-border px-3.5 py-2.5">
          <Search className="mr-2.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search records..."
            className="flex h-7 w-full rounded-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            autoFocus
          />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation
          </div>
          {filteredNav.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No matching pages or commands found.
            </div>
          ) : (
            filteredNav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => handleSelect(item.href)}
                  className="flex w-full items-center gap-2.5 rounded-[4px] px-2.5 py-2 text-xs text-foreground hover:bg-muted focus:bg-muted text-left transition-colors"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
