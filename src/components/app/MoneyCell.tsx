import React from "react";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

interface MoneyCellProps {
  amount: number | string;
  className?: string;
  showDecimals?: boolean;
}

export function MoneyCell({ amount, className, showDecimals = false }: MoneyCellProps) {
  return (
    <span
      data-type="currency"
      className={cn("tabular-nums font-mono-num font-medium text-foreground", className)}
    >
      {formatINR(amount, { showDecimals })}
    </span>
  );
}
