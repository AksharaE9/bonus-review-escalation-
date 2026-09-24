"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AuditDiffProps {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  changedFields?: string[] | null;
}

export function AuditDiff({ before, after, changedFields }: AuditDiffProps) {
  const changedSet = new Set(changedFields || []);

  const renderJsonBlock = (
    data: Record<string, unknown> | null,
    type: "before" | "after"
  ) => {
    if (!data) {
      return (
        <div className="rounded-[4px] border border-border bg-muted/30 p-3 text-xs text-muted-foreground italic font-mono">
          [None]
        </div>
      );
    }

    const entries = Object.entries(data);

    return (
      <div className="rounded-[4px] border border-border bg-card p-3 font-mono text-xs overflow-x-auto">
        <div className="space-y-1">
          {entries.map(([key, val]) => {
            const isChanged = changedSet.has(key);
            const valString =
              typeof val === "object" && val !== null
                ? JSON.stringify(val)
                : String(val);

            return (
              <div
                key={key}
                className={cn(
                  "flex items-start gap-2 py-0.5 px-1.5 rounded-[2px]",
                  isChanged &&
                    type === "before" &&
                    "bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200 border-l-2 border-rose-500",
                  isChanged &&
                    type === "after" &&
                    "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 border-l-2 border-emerald-500",
                  !isChanged && "text-muted-foreground"
                )}
              >
                <span className="font-semibold select-none text-foreground">{key}:</span>
                <span className="break-all font-normal">
                  {valString}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          State Before
        </div>
        {renderJsonBlock(before, "before")}
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          State After
        </div>
        {renderJsonBlock(after, "after")}
      </div>
    </div>
  );
}
