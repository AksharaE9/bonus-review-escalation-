import { describe, it, expect } from "vitest";
import { getSafeCallbackUrl } from "@/lib/auth-routes";

/**
 * Pure simulation of middleware decision table
 */
interface DecisionInput {
  pathname: string;
  searchParams?: Record<string, string>;
  token: {
    id: string;
    role: "ADMIN" | "LEAD" | "USER";
    mustChangePassword?: boolean;
  } | null;
}

interface DecisionResult {
  action: "next" | "redirect";
  destination?: string;
  isProtected?: boolean;
}

function evaluateMiddlewareDecision(input: DecisionInput): DecisionResult {
  const { pathname, searchParams = {}, token } = input;
  const isAuthenticated = Boolean(token);

  // Rule 1: Public root
  if (pathname === "/") {
    return { action: "next", isProtected: false };
  }

  // Rule 2: Authenticated user hitting /sign-in
  if (isAuthenticated && pathname === "/sign-in") {
    const rawCallbackUrl = searchParams.callbackUrl;
    const target = rawCallbackUrl ? getSafeCallbackUrl(rawCallbackUrl) : "/dashboard";
    return { action: "redirect", destination: target };
  }

  // Unauthenticated user hitting /sign-in
  if (!isAuthenticated && pathname === "/sign-in") {
    return { action: "next", isProtected: false };
  }

  // Rule 3: Unauthenticated user hitting protected path
  if (!isAuthenticated) {
    const searchStr = Object.keys(searchParams).length > 0
      ? "?" + new URLSearchParams(searchParams).toString()
      : "";
    const safeOriginal = getSafeCallbackUrl(pathname + searchStr);
    const destination =
      safeOriginal && safeOriginal !== "/sign-in" && safeOriginal !== "/"
        ? `/sign-in?callbackUrl=${encodeURIComponent(safeOriginal)}`
        : "/sign-in";
    return { action: "redirect", destination };
  }

  // Rule 4: Authenticated user with mustChangePassword = true
  const mustChangePassword = Boolean(token?.mustChangePassword);
  if (mustChangePassword) {
    if (pathname !== "/change-password") {
      return { action: "redirect", destination: "/change-password" };
    }
    return { action: "next", isProtected: true };
  }

  if (!mustChangePassword && pathname === "/change-password") {
    return { action: "redirect", destination: "/dashboard" };
  }

  // Rule 5: Pass authenticated requests to server
  return { action: "next", isProtected: true };
}

describe("Middleware Decision Matrix Table", () => {
  const adminToken = { id: "u-1", role: "ADMIN" as const, mustChangePassword: false };
  const leadToken = { id: "u-2", role: "LEAD" as const, mustChangePassword: false };
  const userToken = { id: "u-3", role: "USER" as const, mustChangePassword: false };
  const mustChangeUserToken = { id: "u-4", role: "USER" as const, mustChangePassword: true };

  describe("Rule 1: Public Paths", () => {
    it("allows unauthenticated visitor to view public root '/'", () => {
      const res = evaluateMiddlewareDecision({ pathname: "/", token: null });
      expect(res.action).toBe("next");
      expect(res.isProtected).toBe(false);
    });

    it("allows authenticated user to view public root '/'", () => {
      const res = evaluateMiddlewareDecision({ pathname: "/", token: adminToken });
      expect(res.action).toBe("next");
      expect(res.isProtected).toBe(false);
    });
  });

  describe("Rule 2: Authenticated /sign-in Redirection", () => {
    it("redirects authenticated ADMIN hitting /sign-in to /dashboard", () => {
      const res = evaluateMiddlewareDecision({ pathname: "/sign-in", token: adminToken });
      expect(res.action).toBe("redirect");
      expect(res.destination).toBe("/dashboard");
    });

    it("redirects authenticated user hitting /sign-in with safe callbackUrl to that callbackUrl", () => {
      const res = evaluateMiddlewareDecision({
        pathname: "/sign-in",
        searchParams: { callbackUrl: "/bonuses" },
        token: leadToken,
      });
      expect(res.action).toBe("redirect");
      expect(res.destination).toBe("/bonuses");
    });

    it("sanitizes open-redirect callbackUrl when authenticated user hits /sign-in", () => {
      const res = evaluateMiddlewareDecision({
        pathname: "/sign-in",
        searchParams: { callbackUrl: "//evil.com" },
        token: userToken,
      });
      expect(res.action).toBe("redirect");
      expect(res.destination).toBe("/dashboard");
    });
  });

  describe("Rule 3: Unauthenticated Access to Protected Routes", () => {
    const protectedRoutes = [
      "/dashboard",
      "/admin",
      "/team",
      "/me",
      "/employees",
      "/bonuses",
      "/reviews",
      "/escalations",
      "/audit",
      "/settings",
    ];

    protectedRoutes.forEach((route) => {
      it(`redirects unauthenticated request to ${route} to /sign-in with callbackUrl`, () => {
        const res = evaluateMiddlewareDecision({ pathname: route, token: null });
        expect(res.action).toBe("redirect");
        expect(res.destination).toBe(`/sign-in?callbackUrl=${encodeURIComponent(route)}`);
      });
    });

    it("allows unauthenticated visitor on /sign-in without redirect loop", () => {
      const res = evaluateMiddlewareDecision({ pathname: "/sign-in", token: null });
      expect(res.action).toBe("next");
      expect(res.isProtected).toBe(false);
    });
  });

  describe("Rule 4: mustChangePassword Enforcement", () => {
    it("forces user with mustChangePassword = true to /change-password", () => {
      const res = evaluateMiddlewareDecision({
        pathname: "/dashboard",
        token: mustChangeUserToken,
      });
      expect(res.action).toBe("redirect");
      expect(res.destination).toBe("/change-password");
    });

    it("allows user with mustChangePassword = true on /change-password", () => {
      const res = evaluateMiddlewareDecision({
        pathname: "/change-password",
        token: mustChangeUserToken,
      });
      expect(res.action).toBe("next");
      expect(res.isProtected).toBe(true);
    });

    it("redirects user with mustChangePassword = false away from /change-password to /dashboard", () => {
      const res = evaluateMiddlewareDecision({
        pathname: "/change-password",
        token: adminToken,
      });
      expect(res.action).toBe("redirect");
      expect(res.destination).toBe("/dashboard");
    });
  });

  describe("Rule 5: Authenticated Protected Route Pass-Through", () => {
    it("allows authenticated user through with isProtected = true", () => {
      const res = evaluateMiddlewareDecision({
        pathname: "/admin",
        token: adminToken,
      });
      expect(res.action).toBe("next");
      expect(res.isProtected).toBe(true);
    });
  });
});
