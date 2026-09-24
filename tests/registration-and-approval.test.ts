import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "admin-id", email: "admin@pulse.local", role: "ADMIN" },
  }),
}));

import { registerUserAction } from "@/server/actions/user";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq, and, isNull } from "drizzle-orm";

describe("Registration & Admin Approval Workflow", () => {
  const testEmail = `newemployee.${Date.now()}@pulse.local`;

  it("submits self-registration request with INACTIVE status (Pending Approval)", async () => {
    const res = await registerUserAction({
      fullName: "Arjun Verma",
      email: testEmail,
      password: "Employee@12345",
      designation: "Fullstack Engineer",
    });

    expect(res.success).toBe(true);

    // Verify in database
    const [inserted] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, testEmail), isNull(users.deletedAt)));

    expect(inserted).toBeDefined();
    expect(inserted.fullName).toBe("Arjun Verma");
    expect(inserted.status).toBe("INACTIVE"); // Pending approval
    expect(inserted.role).toBe("USER");
    expect(inserted.employeeCode).toMatch(/^EMP-\d+/);
  });

  it("rejects duplicate registration with existing email", async () => {
    const duplicateRes = await registerUserAction({
      fullName: "Arjun Verma Duplicate",
      email: testEmail,
      password: "Employee@12345",
    });

    expect(duplicateRes.success).toBeUndefined();
    expect(duplicateRes.error).toContain("already exists");
  });

  it("rejects password shorter than 8 characters", async () => {
    const shortPassRes = await registerUserAction({
      fullName: "Short Pass User",
      email: `shortpass.${Date.now()}@pulse.local`,
      password: "123",
    });

    expect(shortPassRes.success).toBeUndefined();
    expect(shortPassRes.error).toContain("at least 8 characters");
  });
});
