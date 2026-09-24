import type {
  CreateBonusInput,
} from "@/lib/validators/bonus";
import type {
  SaveReviewInput,
} from "@/lib/validators/review";
import type {
  CreateEscalationInput,
} from "@/lib/validators/escalation";

export const testFactory = {
  validBonus(employeeId: string, overrides: Partial<CreateBonusInput> = {}): CreateBonusInput {
    return {
      employeeId,
      amount: "25000.00",
      currency: "INR",
      bonusType: "PERFORMANCE",
      reason: "Outstanding delivery on the core enterprise feature rollout.",
      periodMonth: "2026-09-01",
      ...overrides,
    };
  },

  invalidShortReasonBonus(employeeId: string): CreateBonusInput {
    return {
      employeeId,
      amount: "25000.00",
      currency: "INR",
      bonusType: "PERFORMANCE",
      reason: "Short", // < 10 chars -> Must fail
    };
  },

  validEscalation(overrides: Partial<CreateEscalationInput> = {}): CreateEscalationInput {
    return {
      origin: "EMPLOYEE",
      category: "WORKPLACE",
      severity: "MEDIUM",
      title: "Broken air conditioning unit in east wing",
      description: "The air conditioning unit in the east wing has been malfunctioning for three days.",
      isAnonymous: false,
      isConfidential: false,
      ...overrides,
    };
  },

  validReview(employeeId: string, overrides: Partial<SaveReviewInput> = {}): SaveReviewInput {
    return {
      employeeId,
      reviewType: "QUARTERLY",
      periodStart: "2026-07-01",
      periodEnd: "2026-09-30",
      summary: "Consistently demonstrated strong architectural discipline and timely delivery.",
      strengths: "Excellent technical problem-solving and mentoring of peers.",
      improvements: "Continue improving documentation turnaround time.",
      goals: [{ goal: "Lead the migration to Drizzle ORM", completed: false, targetDate: "2026-12-31" }],
      visibility: "SHARED",
      isDraft: false,
      isRatingOverridden: false,
      ratings: [],
      ...overrides,
    };
  },
};
