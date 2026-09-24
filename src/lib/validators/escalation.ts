import { z } from "zod";

export const escOriginEnumValues = ["MANAGEMENT", "EMPLOYEE"] as const;
export const escCategoryEnumValues = [
  "PERFORMANCE",
  "ATTENDANCE",
  "BEHAVIOUR",
  "POLICY_VIOLATION",
  "CLIENT_COMPLAINT",
  "PAYROLL",
  "WORKPLACE",
  "IT_ASSET",
  "INTERPERSONAL",
  "OTHER",
] as const;

export const escSeverityEnumValues = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const escStatusEnumValues = [
  "OPEN",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "AWAITING_EMPLOYEE",
  "RESOLVED",
  "CLOSED",
  "WITHDRAWN",
] as const;

export const visibilityEnumValues = ["INTERNAL", "SHARED"] as const;

export type EscStatus = (typeof escStatusEnumValues)[number];
export type EscOrigin = (typeof escOriginEnumValues)[number];
export type EscCategory = (typeof escCategoryEnumValues)[number];
export type EscSeverity = (typeof escSeverityEnumValues)[number];
export type CommentVisibility = (typeof visibilityEnumValues)[number];

export const createEscalationSchema = z.object({
  origin: z.enum(escOriginEnumValues),
  subjectEmployeeId: z.string().uuid("Invalid subject employee ID").optional().nullable(),
  assignedTo: z.string().uuid("Invalid assignee ID").optional().nullable(),
  category: z.enum(escCategoryEnumValues, {
    required_error: "Category is required",
  }),
  severity: z.enum(escSeverityEnumValues).default("MEDIUM"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title must not exceed 150 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .refine((val) => val.trim().length >= 10, {
      message: "Description must contain at least 10 non-whitespace characters",
    }),
  isAnonymous: z.boolean().default(false),
  isConfidential: z.boolean().default(false),
});

export type CreateEscalationInput = z.infer<typeof createEscalationSchema>;

export const updateEscalationStatusSchema = z
  .object({
    status: z.enum(escStatusEnumValues),
    resolution: z.string().optional().nullable(),
    comment: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "RESOLVED" || data.status === "CLOSED") {
      if (!data.resolution || data.resolution.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["resolution"],
          message: "Resolution details (min 10 characters) are required when resolving or closing an escalation",
        });
      }
    }
  });

export type UpdateEscalationStatusInput = z.infer<typeof updateEscalationStatusSchema>;

export const addEscalationCommentSchema = z.object({
  escalationId: z.string().uuid("Invalid escalation ID"),
  body: z.string().min(2, "Comment must be at least 2 characters").refine((v) => v.trim().length >= 2, {
    message: "Comment cannot be empty",
  }),
  visibility: z.enum(visibilityEnumValues).default("SHARED"),
});

export type AddEscalationCommentInput = z.infer<typeof addEscalationCommentSchema>;

/**
 * Valid state transitions for Escalations
 */
export const VALID_TRANSITIONS: Record<EscStatus, EscStatus[]> = {
  OPEN: ["ACKNOWLEDGED", "IN_PROGRESS", "WITHDRAWN"],
  ACKNOWLEDGED: ["IN_PROGRESS", "WITHDRAWN"],
  IN_PROGRESS: ["AWAITING_EMPLOYEE", "RESOLVED", "WITHDRAWN"],
  AWAITING_EMPLOYEE: ["IN_PROGRESS", "RESOLVED", "WITHDRAWN"],
  RESOLVED: ["IN_PROGRESS", "CLOSED"],
  CLOSED: [], // Terminal
  WITHDRAWN: [], // Terminal
};

export function isValidTransition(from: EscStatus, to: EscStatus): boolean {
  if (from === to) return true;
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}
