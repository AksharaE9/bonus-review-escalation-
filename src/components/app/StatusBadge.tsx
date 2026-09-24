import React from "react";
import { Badge } from "@/components/ui/badge";
import type { BonusStatus, ReviewStatus, EscalationStatus, UserStatus } from "@/types";

interface StatusBadgeProps {
  status: BonusStatus | ReviewStatus | EscalationStatus | UserStatus | string;
  type?: "bonus" | "review" | "escalation" | "user";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const norm = status?.toUpperCase();

  switch (norm) {
    // Bonus statuses
    case "DRAFT":
      return <Badge variant="secondary">Draft</Badge>;
    case "PENDING_APPROVAL":
      return <Badge variant="warning">Pending Approval</Badge>;
    case "APPROVED":
      return <Badge variant="success">Approved</Badge>;
    case "REJECTED":
      return <Badge variant="danger">Rejected</Badge>;
    case "PAID":
      return <Badge variant="default">Paid</Badge>;
    case "CANCELLED":
      return <Badge variant="secondary">Cancelled</Badge>;

    // Review statuses
    case "SUBMITTED":
      return <Badge variant="info">Submitted</Badge>;
    case "ACKNOWLEDGED":
      return <Badge variant="success">Acknowledged</Badge>;
    case "CLOSED":
      return <Badge variant="secondary">Closed</Badge>;

    // Escalation statuses
    case "OPEN":
      return <Badge variant="info">Open</Badge>;
    case "IN_PROGRESS":
      return <Badge variant="warning">In Progress</Badge>;
    case "AWAITING_EMPLOYEE":
      return <Badge variant="warning">Awaiting Employee</Badge>;
    case "RESOLVED":
      return <Badge variant="success">Resolved</Badge>;
    case "WITHDRAWN":
      return <Badge variant="secondary">Withdrawn</Badge>;

    // User statuses
    case "ACTIVE":
      return <Badge variant="success">Active</Badge>;
    case "INACTIVE":
      return <Badge variant="secondary">Inactive</Badge>;
    case "SUSPENDED":
      return <Badge variant="danger">Suspended</Badge>;

    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
