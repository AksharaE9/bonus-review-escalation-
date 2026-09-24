"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App boundary error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
      <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mb-3">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Failed to load section data
      </h2>
      <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4">
        {error.message || "An unexpected database or session error occurred."}
      </p>
      <Button
        size="sm"
        variant="outline"
        onClick={() => reset()}
        className="text-xs gap-1.5"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Retry
      </Button>
    </div>
  );
}
