"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring if configured
    console.error("Unhandled runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-50">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">System Encountered an Error</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {error.message || "An unexpected error occurred during page processing."}
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <Button
            size="sm"
            onClick={() => reset()}
            className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry Action
          </Button>
        </div>
      </div>
    </div>
  );
}
