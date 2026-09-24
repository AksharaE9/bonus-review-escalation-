import React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatTileProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  className?: string;
}

export function StatTile({
  label,
  value,
  subtext,
  icon: Icon,
  badge,
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-[8px] border border-border bg-card p-4 transition-subtle",
        className
      )}
    >
      <div className="flex items-center justify-between text-muted-foreground mb-1.5">
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="h-4 w-4 opacity-70" />}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </div>
        {badge}
      </div>
      {subtext && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
    </div>
  );
}
