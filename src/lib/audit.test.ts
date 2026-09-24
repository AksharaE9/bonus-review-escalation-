import { describe, it, expect } from "vitest";
import { computeChangedFields } from "./audit";

describe("Audit Diff Engine (computeChangedFields)", () => {
  it("detects created records when before is null", () => {
    const after = { id: "123", amount: "50000.00", status: "PENDING_APPROVAL" };
    const changed = computeChangedFields(null, after);
    expect(changed).toEqual(["id", "amount", "status"]);
  });

  it("detects deleted records when after is null", () => {
    const before = { id: "123", amount: "50000.00", status: "PENDING_APPROVAL" };
    const changed = computeChangedFields(before, null);
    expect(changed).toEqual(["id", "amount", "status"]);
  });

  it("detects modified fields accurately", () => {
    const before = {
      id: "b-1",
      status: "PENDING_APPROVAL",
      amount: "50000.00",
      reason: "Initial bonus reason",
      approved_by: null,
    };
    const after = {
      id: "b-1",
      status: "APPROVED",
      amount: "50000.00",
      reason: "Initial bonus reason",
      approved_by: "admin-uuid",
    };

    const changed = computeChangedFields(before, after);
    expect(changed).toContain("status");
    expect(changed).toContain("approved_by");
    expect(changed).not.toContain("amount");
    expect(changed).not.toContain("reason");
    expect(changed).not.toContain("id");
  });

  it("returns empty array when objects are identical", () => {
    const before = { status: "ACTIVE", score: 4.5 };
    const after = { status: "ACTIVE", score: 4.5 };
    expect(computeChangedFields(before, after)).toEqual([]);
  });
});
