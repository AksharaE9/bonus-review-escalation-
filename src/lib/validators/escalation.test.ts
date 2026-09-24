import { describe, it, expect } from "vitest";
import {
  createEscalationSchema,
  updateEscalationStatusSchema,
  isValidTransition,
} from "./escalation";

describe("Escalation Validators & State Machine", () => {
  it("validates escalation creation requiring description >= 10 chars", () => {
    const invalid = createEscalationSchema.safeParse({
      origin: "EMPLOYEE",
      category: "WORKPLACE",
      severity: "HIGH",
      title: "Broken AC",
      description: "Short",
    });
    expect(invalid.success).toBe(false);

    const valid = createEscalationSchema.safeParse({
      origin: "EMPLOYEE",
      category: "WORKPLACE",
      severity: "HIGH",
      title: "Broken AC unit in main bay",
      description: "The air conditioner in the main bay has been leaking water for 3 days.",
      isAnonymous: false,
      isConfidential: false,
    });
    expect(valid.success).toBe(true);
  });

  it("requires resolution details when resolving or closing an escalation", () => {
    const invalidResolve = updateEscalationStatusSchema.safeParse({
      status: "RESOLVED",
      resolution: "",
    });
    expect(invalidResolve.success).toBe(false);

    const validResolve = updateEscalationStatusSchema.safeParse({
      status: "RESOLVED",
      resolution: "Maintenance technician repaired the drainage pipe.",
    });
    expect(validResolve.success).toBe(true);
  });

  it("enforces valid state machine transitions", () => {
    expect(isValidTransition("OPEN", "ACKNOWLEDGED")).toBe(true);
    expect(isValidTransition("OPEN", "IN_PROGRESS")).toBe(true);
    expect(isValidTransition("OPEN", "WITHDRAWN")).toBe(true);
    expect(isValidTransition("OPEN", "CLOSED")).toBe(false); // Illegal direct jump to CLOSED

    expect(isValidTransition("IN_PROGRESS", "AWAITING_EMPLOYEE")).toBe(true);
    expect(isValidTransition("AWAITING_EMPLOYEE", "IN_PROGRESS")).toBe(true);
    expect(isValidTransition("IN_PROGRESS", "RESOLVED")).toBe(true);
    expect(isValidTransition("RESOLVED", "CLOSED")).toBe(true);
    expect(isValidTransition("RESOLVED", "IN_PROGRESS")).toBe(true); // Re-open

    expect(isValidTransition("CLOSED", "OPEN")).toBe(false); // Terminal
    expect(isValidTransition("WITHDRAWN", "OPEN")).toBe(false); // Terminal
  });
});
