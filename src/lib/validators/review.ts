import { z } from "zod";

export const ReviewTypeEnumSchema = z.enum([
  "MONTHLY",
  "QUARTERLY",
  "HALF_YEARLY",
  "ANNUAL",
  "PROBATION",
  "PROJECT",
  "PIP",
  "ADHOC",
]);

export const ReviewStatusEnumSchema = z.enum([
  "DRAFT",
  "SUBMITTED",
  "ACKNOWLEDGED",
  "CLOSED",
]);

export const CompetencyRatingInputSchema = z.object({
  competencyId: z.string().uuid(),
  score: z.number().min(1.0).max(5.0),
  comment: z.string().optional().nullable(),
});

export const GoalItemSchema = z.object({
  goal: z.string().min(3, "Goal description is required"),
  targetDate: z.string().optional(),
  completed: z.boolean().default(false),
});

export const SaveReviewSchema = z.object({
  id: z.string().uuid().optional(),
  employeeId: z.string().uuid("Please select an employee"),
  cycleId: z.string().uuid().optional().nullable(),
  reviewType: ReviewTypeEnumSchema,
  periodStart: z.string().min(1, "Period start is required"),
  periodEnd: z.string().min(1, "Period end is required"),
  overallRating: z.number().min(1.0).max(5.0).optional().nullable(),
  isRatingOverridden: z.boolean().default(false),
  summary: z
    .string()
    .trim()
    .min(10, "Summary must be at least 10 characters long"),
  strengths: z.string().optional().nullable(),
  improvements: z.string().optional().nullable(),
  goals: z.array(GoalItemSchema).default([]),
  ratings: z.array(CompetencyRatingInputSchema).default([]),
  visibility: z.enum(["INTERNAL", "SHARED"]).default("SHARED"),
  isDraft: z.boolean().default(false),
});

export const AcknowledgeReviewSchema = z.object({
  reviewId: z.string().uuid(),
  employeeComment: z.string().optional().nullable(),
});

export type SaveReviewInput = z.infer<typeof SaveReviewSchema>;
export type AcknowledgeReviewInput = z.infer<typeof AcknowledgeReviewSchema>;

/**
 * Computes weighted mean overall rating given competency scores and their defined weights
 */
export function calculateWeightedOverallScore(
  ratings: Array<{ competencyId: string; score: number }>,
  competencies: Array<{ id: string; weight: string | number }>
): number {
  if (!ratings || ratings.length === 0) return 0;

  const weightMap = new Map<string, number>();
  for (const c of competencies) {
    weightMap.set(c.id, typeof c.weight === "string" ? parseFloat(c.weight) : c.weight);
  }

  let totalWeight = 0;
  let weightedSum = 0;

  for (const r of ratings) {
    const w = weightMap.get(r.competencyId) || 1.0;
    weightedSum += r.score * w;
    totalWeight += w;
  }

  if (totalWeight === 0) return 0;
  const score = weightedSum / totalWeight;
  return Math.round(score * 10) / 10; // 1 decimal place
}
