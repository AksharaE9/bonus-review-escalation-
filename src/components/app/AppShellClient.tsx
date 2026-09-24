"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "./CommandPalette";
import type { Role, SessionUser } from "@/types";

interface AppShellClientProps {
  user: SessionUser;
  children: React.ReactNode;
}

export function AppShellClient({ user, children }: AppShellClientProps) {
  const [previewRole, setPreviewRole] = useState<Role | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar user={user} previewRole={previewRole} />

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Persistent "View As Role" Banner if previewing */}
        {previewRole && (
          <div className="flex items-center justify-between bg-amber-500/10 border-b border-amber-500/30 px-4 py-1.5 text-xs text-amber-700 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <span className="font-semibold">ROLE PREVIEW ACTIVE:</span>
              <span>
                Simulating UI experience as <strong>{previewRole}</strong>. Server-side data access boundaries remain in effect.
              </span>
            </div>
            <button
              onClick={() => setPreviewRole(null)}
              className="text-xs font-semibold underline hover:text-amber-900 dark:hover:text-amber-100"
            >
              Exit Preview
            </button>
          </div>
        )}

        {/* Topbar */}
        <Topbar
          user={user}
          previewRole={previewRole}
          onSelectPreviewRole={setPreviewRole}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        user={user}
      />
    </div>
  );
}
