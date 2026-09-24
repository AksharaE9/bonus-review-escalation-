"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function ScorecardPrintButton({ autoPrint }: { autoPrint?: boolean }) {
  useEffect(() => {
    if (autoPrint) {
      window.print();
    }
  }, [autoPrint]);

  return (
    <Button
      size="sm"
      onClick={() => window.print()}
      className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
    >
      <Printer className="h-3.5 w-3.5" />
      <span>Print / Save PDF</span>
    </Button>
  );
}
