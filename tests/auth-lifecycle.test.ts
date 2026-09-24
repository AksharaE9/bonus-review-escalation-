import { describe, it, expect } from "vitest";
import { authConfig } from "@/auth.config";
import bcrypt from "bcryptjs";
import type { Role } from "@/types";

describe("Auth Lifecycle, JWT & Session Callbacks", () => {
  const mockUser = {
    id: "user-uuid-123",
    email: "priya@pulse.local",
    name: "Priya Sharma",
    fullName: "Priya Sharma",
    role: "ADMIN" as Role,
    departmentId: "dept-uuid-456",
    employeeCode: "EMP001",
    mustChangePassword: false,
    sessionVersion: 1,
  };

  it("populates JWT token on initial sign in", async () => {
    const jwtCallback = authConfig.callbacks?.jwt as any;
    expect(jwtCallback).toBeDefined();

    const token = await jwtCallback({
      token: {},
      user: mockUser,
      account: null,
      trigger: "signIn",
    });

    expect(token.id).toBe("user-uuid-123");
    expect(token.role).toBe("ADMIN");
    expect(token.departmentId).toBe("dept-uuid-456");
    expect(token.employeeCode).toBe("EMP001");
    expect(token.fullName).toBe("Priya Sharma");
    expect(token.mustChangePassword).toBe(false);
    expect(token.sessionVersion).toBe(1);
  });

  it("propagates session updates to JWT token on update trigger", async () => {
    const jwtCallback = authConfig.callbacks?.jwt as any;
    const initialToken = {
      id: "user-uuid-123",
      role: "USER" as Role,
      departmentId: null,
      mustChangePassword: true,
      sessionVersion: 1,
    };

    const updatedToken = await jwtCallback({
      token: initialToken,
      trigger: "update",
      session: {
        mustChangePassword: false,
        fullName: "Priya S.",
        sessionVersion: 2,
      },
    });

    expect(updatedToken.mustChangePassword).toBe(false);
    expect(updatedToken.fullName).toBe("Priya S.");
    expect(updatedToken.sessionVersion).toBe(2);
  });

  it("populates session.user from JWT token", async () => {
    const sessionCallback = authConfig.callbacks?.session as any;
    expect(sessionCallback).toBeDefined();

    const token = {
      id: "user-uuid-123",
      role: "LEAD" as Role,
      departmentId: "dept-789",
      employeeCode: "EMP002",
      fullName: "Rajesh Menon",
      mustChangePassword: false,
      sessionVersion: 1,
    };

    const session = await sessionCallback({
      session: {
        user: {
          id: "",
          email: "rajesh@pulse.local",
          role: "USER" as Role,
          departmentId: null,
          mustChangePassword: true,
          sessionVersion: 1,
          emailVerified: null,
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      },
      token,
    });

    expect(session.user.id).toBe("user-uuid-123");
    expect(session.user.role).toBe("LEAD");
    expect(session.user.departmentId).toBe("dept-789");
    expect(session.user.employeeCode).toBe("EMP002");
    expect(session.user.fullName).toBe("Rajesh Menon");
    expect(session.user.mustChangePassword).toBe(false);
    expect(session.user.sessionVersion).toBe(1);
  });

  it("ensures passwords can be securely verified with bcrypt", async () => {
    const rawPassword = "Admin@12345";
    const hash = await bcrypt.hash(rawPassword, 10);
    expect(await bcrypt.compare(rawPassword, hash)).toBe(true);
    expect(await bcrypt.compare("WrongPassword", hash)).toBe(false);
  });
});
