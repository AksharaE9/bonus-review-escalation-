import React from "react";
import { Badge } from "@/components/ui/badge";
import type { EscalationSeverity } from "@/types";

interface SeverityBadgeProps {
  severity: EscalationSeverity | string;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const norm = severity?.toUpperCase();

  switch (norm) {
    case "LOW":
      return <Badge variant="secondary">Low</Badge>;
    case "MEDIUM":
      return <Badge variant="info">Medium</Badge>;
    case "HIGH":
      return <Badge variant="warning">High</Badge>;
    case "CRITICAL":
      return <Badge variant="danger">Critical</Badge>;
    default:
      return <Badge variant="outline">{severity}</Badge>;
  }
}
