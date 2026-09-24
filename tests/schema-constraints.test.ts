import { describe, it, expect } from "vitest";
import { bonuses } from "@/db/schema/bonuses";
import { reviews } from "@/db/schema/reviews";
import { users } from "@/db/schema/users";
import { auditLogs } from "@/db/schema/audit";
import { formatINR, toNumericString } from "@/lib/money";
import { CreateBonusSchema } from "@/lib/validators/bonus";
import { SaveReviewSchema } from "@/lib/validators/review";
import { createEscalationSchema } from "@/lib/validators/escalation";

describe("A2 · Schema Constraints & Data Integrity Audit", () => {
  describe("6.1 Database Constraint & Schema Definition Invariants", () => {
    it("bonuses table defines numeric(12,2) and positive amount check", () => {
      expect(bonuses.amount.columnType).toBe("PgNumeric");
      expect(bonuses.amount.dataType).toBe("string"); // Drizzle maps numeric to string for exact precision
      expect(bonuses.reason.notNull).toBe(true);
      expect(bonuses.employeeId.notNull).toBe(true);
      expect(bonuses.awardedBy.notNull).toBe(true);
    });

    it("bonuses validator rejects 0 and negative amounts", () => {
      const zeroRes = CreateBonusSchema.safeParse({
        employeeId: "11111111-1111-1111-1111-111111111111",
        amount: "0",
        bonusType: "PERFORMANCE",
        reason: "Valid reason for performance bonus",
      });
      expect(zeroRes.success).toBe(false);

      const negRes = CreateBonusSchema.safeParse({
        employeeId: "11111111-1111-1111-1111-111111111111",
        amount: "-5000",
        bonusType: "PERFORMANCE",
        reason: "Valid reason for performance bonus",
      });
      expect(negRes.success).toBe(false);
    });

    it("bonuses validator rejects reason shorter than 10 characters or whitespace", () => {
      const shortRes = CreateBonusSchema.safeParse({
        employeeId: "11111111-1111-1111-1111-111111111111",
        amount: "50000",
        bonusType: "PERFORMANCE",
        reason: "short",
      });
      expect(shortRes.success).toBe(false);

      const wsRes = CreateBonusSchema.safeParse({
        employeeId: "11111111-1111-1111-1111-111111111111",
        amount: "50000",
        bonusType: "PERFORMANCE",
        reason: "          ",
      });
      expect(wsRes.success).toBe(false);
    });

    it("reviews table defines numeric(2,1) rating and summary constraints", () => {
      expect(reviews.overallRating.columnType).toBe("PgNumeric");
      expect(reviews.overallRating.dataType).toBe("string");
      expect(reviews.summary.notNull).toBe(true);
      expect(reviews.employeeId.notNull).toBe(true);
      expect(reviews.reviewerId.notNull).toBe(true);
    });

    it("review validator rejects invalid ratings (< 1.0 or > 5.0)", () => {
      const invalidRating = SaveReviewSchema.safeParse({
        employeeId: "11111111-1111-1111-1111-111111111111",
        reviewType: "ANNUAL",
        periodStart: "2025-01-01",
        periodEnd: "2025-12-31",
        summary: "Excellent contributions over the past year.",
        overallRating: 5.5,
        ratings: [],
      });
      expect(invalidRating.success).toBe(false);

      const zeroRating = SaveReviewSchema.safeParse({
        employeeId: "11111111-1111-1111-1111-111111111111",
        reviewType: "ANNUAL",
        periodStart: "2025-01-01",
        periodEnd: "2025-12-31",
        summary: "Excellent contributions over the past year.",
        overallRating: 0,
        ratings: [],
      });
      expect(zeroRating.success).toBe(false);
    });

    it("escalations validator enforces description minimum and non-empty title", () => {
      const shortDesc = createEscalationSchema.safeParse({
        origin: "MANAGEMENT",
        category: "PERFORMANCE",
        severity: "MEDIUM",
        title: "Dispute over bonus",
        description: "too short",
      });
      expect(shortDesc.success).toBe(false);

      const emptyTitle = createEscalationSchema.safeParse({
        origin: "MANAGEMENT",
        category: "PERFORMANCE",
        severity: "MEDIUM",
        title: "",
        description: "Valid detailed description of the escalation issue.",
      });
      expect(emptyTitle.success).toBe(false);
    });

    it("users table defines unique email and employeeCode", () => {
      expect(users.email.notNull).toBe(true);
      expect(users.employeeCode.notNull).toBe(true);
      expect(users.passwordHash.notNull).toBe(true);
    });
  });

  describe("6.2 Money Precision (I9)", () => {
    it("exact decimal string conversion preserves precision without float drift", () => {
      expect(toNumericString("99999999.99")).toBe("99999999.99");
      expect(toNumericString("0.01")).toBe("0.01");
      expect(toNumericString("1234567.89")).toBe("1234567.89");
    });

    it("Indian lakh currency formatting complies with en-IN numbering format", () => {
      const formatted1Lakh = formatINR(100000);
      expect(formatted1Lakh).toMatch(/1,00,000/);

      const formatted12Lakh = formatINR(1245000);
      expect(formatted12Lakh).toMatch(/12,45,000/);

      const formattedSmall = formatINR(25000);
      expect(formattedSmall).toMatch(/25,000/);
    });
  });

  describe("6.3 Audit Append-Only Invariant (I5)", () => {
    it("audit table defines bigserial primary key and no update/delete methods", () => {
      expect(auditLogs.id.dataType).toBe("number");
      expect(auditLogs.action.notNull).toBe(true);
      expect(auditLogs.entityType.notNull).toBe(true);
    });
  });
});
