import { describe, it, expect } from "vitest";
import {
  CreateBonusSchema,
  RejectBonusSchema,
} from "./bonus";

describe("Bonus Validators (Section 2 & 8.5)", () => {
  it("rejects bonus with reason less than 10 characters", () => {
    const res = CreateBonusSchema.safeParse({
      employeeId: "11111111-1111-1111-1111-111111111111",
      amount: "25000",
      currency: "INR",
      bonusType: "PERFORMANCE",
      reason: "Short", // < 10 characters
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.errors[0].message).toContain("at least 10 characters");
    }
  });

  it("accepts valid bonus with reason >= 10 characters", () => {
    const res = CreateBonusSchema.safeParse({
      employeeId: "11111111-1111-1111-1111-111111111111",
      amount: "50,000",
      currency: "INR",
      bonusType: "SPOT",
      reason: "Exceptional architecture refactoring of webhook processing engine",
    });
    expect(res.success).toBe(true);
  });

  it("rejects non-positive or invalid amounts", () => {
    const res = CreateBonusSchema.safeParse({
      employeeId: "11111111-1111-1111-1111-111111111111",
      amount: "0",
      currency: "INR",
      bonusType: "SPOT",
      reason: "Valid description for bonus award",
    });
    expect(res.success).toBe(false);
  });

  it("rejects rejection without mandatory min 10 char rejection reason", () => {
    const res = RejectBonusSchema.safeParse({
      bonusId: "11111111-1111-1111-1111-111111111111",
      rejectionReason: "No", // < 10 characters
    });
    expect(res.success).toBe(false);
  });
});
