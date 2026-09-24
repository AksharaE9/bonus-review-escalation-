import { describe, it, expect } from "vitest";
import {
  calculateWeightedOverallScore,
  SaveReviewSchema,
} from "./review";

describe("Review Module Calculations & Validators (Section 6 & 8.6)", () => {
  it("calculates weighted overall competency score accurately against fixture", () => {
    const competencies = [
      { id: "c1", weight: "1.25" }, // Ownership
      { id: "c2", weight: "1.25" }, // Quality of Work
      { id: "c3", weight: "1.00" }, // Communication
      { id: "c4", weight: "1.00" }, // Collaboration
      { id: "c5", weight: "0.75" }, // Reliability
      { id: "c6", weight: "1.25" }, // Problem Solving
      { id: "c7", weight: "1.00" }, // Client Handling
      { id: "c8", weight: "0.75" }, // Learning & Growth
    ];
    // Total weight = 1.25 + 1.25 + 1.00 + 1.00 + 0.75 + 1.25 + 1.00 + 0.75 = 8.25

    const ratings = [
      { competencyId: "c1", score: 5.0 }, // 5.0 * 1.25 = 6.25
      { competencyId: "c2", score: 4.5 }, // 4.5 * 1.25 = 5.625
      { competencyId: "c3", score: 4.0 }, // 4.0 * 1.00 = 4.0
      { competencyId: "c4", score: 4.0 }, // 4.0 * 1.00 = 4.0
      { competencyId: "c5", score: 5.0 }, // 5.0 * 0.75 = 3.75
      { competencyId: "c6", score: 4.5 }, // 4.5 * 1.25 = 5.625
      { competencyId: "c7", score: 4.0 }, // 4.0 * 1.00 = 4.0
      { competencyId: "c8", score: 4.0 }, // 4.0 * 0.75 = 3.0
    ];
    // Weighted sum = 6.25 + 5.625 + 4.0 + 4.0 + 3.75 + 5.625 + 4.0 + 3.0 = 36.25
    // Mean = 36.25 / 8.25 = 4.3939 -> 4.4

    const computed = calculateWeightedOverallScore(ratings, competencies);
    expect(computed).toBe(4.4);
  });

  it("validates that review summary requires at least 10 characters", () => {
    const res = SaveReviewSchema.safeParse({
      employeeId: "11111111-1111-1111-1111-111111111111",
      reviewType: "ANNUAL",
      periodStart: "2025-04-01",
      periodEnd: "2026-03-31",
      summary: "Too short", // < 10 chars
    });
    expect(res.success).toBe(false);
  });
});
