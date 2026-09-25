/**
 * Core Design & Layering Tokens for Pulse
 * 
 * Strict single source of truth for:
 * 1. Z-Index Token Scale
 * 2. Semantic Status Mapping
 * 3. Theme Colors & Tokens
 */

export const Z_INDEX = {
  base: 0,
  sticky: 10,
  header: 20,
  sidebar: 30,
  overlay: 40,
  dialog: 50,
  popover: 60,
  toast: 70,
} as const;

export type ZIndexLevel = keyof typeof Z_INDEX;

export const SEMANTIC_COLORS = {
  // Bonus status mapping
  bonus: {
    DRAFT: { label: "Draft", variant: "neutral" },
    CANCELLED: { label: "Cancelled", variant: "neutral" },
    PENDING: { label: "Pending", variant: "amber" },
    APPROVED: { label: "Approved", variant: "emerald" },
    REJECTED: { label: "Rejected", variant: "rose" },
    PAID: { label: "Paid", variant: "accent" },
  },
  // Escalation severity mapping
  escalationSeverity: {
    LOW: { label: "Low", variant: "neutral" },
    MEDIUM: { label: "Medium", variant: "sky" },
    HIGH: { label: "High", variant: "amber" },
    CRITICAL: { label: "Critical", variant: "rose" },
  },
  // Escalation status mapping
  escalationStatus: {
    OPEN: { label: "Open", variant: "sky" },
    ACKNOWLEDGED: { label: "Acknowledged", variant: "sky" },
    IN_PROGRESS: { label: "In Progress", variant: "amber" },
    AWAITING_INPUT: { label: "Awaiting Input", variant: "amber" },
    RESOLVED: { label: "Resolved", variant: "emerald" },
    CLOSED: { label: "Closed", variant: "neutral" },
    WITHDRAWN: { label: "Withdrawn", variant: "neutral" },
  },
  // Review status mapping
  reviewStatus: {
    DRAFT: { label: "Draft", variant: "neutral" },
    SUBMITTED: { label: "Submitted", variant: "sky" },
    ACKNOWLEDGED: { label: "Acknowledged", variant: "emerald" },
    CLOSED: { label: "Closed", variant: "neutral" },
  },
} as const;
