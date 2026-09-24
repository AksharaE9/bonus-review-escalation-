import { describe, it, expect } from "vitest";
import { ROLE_LANDING, getSafeCallbackUrl } from "@/lib/auth-routes";
import type { Role } from "@/types";

describe("Auth Routes & Role Landing Mapping", () => {
  it("maps all roles exhaustively to their dedicated landing routes", () => {
    const roles: Role[] = ["ADMIN", "LEAD", "USER"];
    roles.forEach((role) => {
      expect(ROLE_LANDING[role]).toBeDefined();
      expect(typeof ROLE_LANDING[role]).toBe("string");
      expect(ROLE_LANDING[role].startsWith("/")).toBe(true);
    });

    expect(ROLE_LANDING.ADMIN).toBe("/admin");
    expect(ROLE_LANDING.LEAD).toBe("/team");
    expect(ROLE_LANDING.USER).toBe("/me");
  });

  describe("Open-Redirect Callback URL Sanitizer (getSafeCallbackUrl)", () => {
    it("accepts valid relative same-origin paths", () => {
      expect(getSafeCallbackUrl("/admin")).toBe("/admin");
      expect(getSafeCallbackUrl("/team")).toBe("/team");
      expect(getSafeCallbackUrl("/me")).toBe("/me");
      expect(getSafeCallbackUrl("/dashboard")).toBe("/dashboard");
      expect(getSafeCallbackUrl("/escalations/ESC-2026-00042")).toBe("/escalations/ESC-2026-00042");
      expect(getSafeCallbackUrl("/bonuses?filter=pending")).toBe("/bonuses?filter=pending");
    });

    it("falls back to /dashboard for empty, null, or undefined inputs", () => {
      expect(getSafeCallbackUrl(null)).toBe("/dashboard");
      expect(getSafeCallbackUrl(undefined)).toBe("/dashboard");
      expect(getSafeCallbackUrl("")).toBe("/dashboard");
      expect(getSafeCallbackUrl("   ")).toBe("/dashboard");
    });

    it("rejects protocol-relative open-redirect payloads (//evil.com)", () => {
      expect(getSafeCallbackUrl("//evil.com")).toBe("/dashboard");
      expect(getSafeCallbackUrl("//attacker.org/phish")).toBe("/dashboard");
      expect(getSafeCallbackUrl("///attacker.org")).toBe("/dashboard");
    });

    it("rejects backslash bypass payloads (/\\evil.com, /\\\\evil.com)", () => {
      expect(getSafeCallbackUrl("/\\evil.com")).toBe("/dashboard");
      expect(getSafeCallbackUrl("/\\attacker.org")).toBe("/dashboard");
      expect(getSafeCallbackUrl("/path\\with\\backslash")).toBe("/dashboard");
    });

    it("rejects absolute URLs with external protocols (https:, http:, ftp:)", () => {
      expect(getSafeCallbackUrl("https://evil.com")).toBe("/dashboard");
      expect(getSafeCallbackUrl("http://evil.com")).toBe("/dashboard");
      expect(getSafeCallbackUrl("ftp://evil.com")).toBe("/dashboard");
    });

    it("rejects dangerous URI schemes (javascript:, data:, vbscript:)", () => {
      expect(getSafeCallbackUrl("javascript:alert(1)")).toBe("/dashboard");
      expect(getSafeCallbackUrl("data:text/html,<script>alert(1)</script>")).toBe("/dashboard");
      expect(getSafeCallbackUrl("vbscript:msgbox(1)")).toBe("/dashboard");
    });

    it("rejects control characters, CRLF injection, and null bytes", () => {
      expect(getSafeCallbackUrl("/dashboard\r\nSet-Cookie: evil=1")).toBe("/dashboard");
      expect(getSafeCallbackUrl("/dashboard\nLocation: http://evil.com")).toBe("/dashboard");
      expect(getSafeCallbackUrl("/dashboard\0")).toBe("/dashboard");
      expect(getSafeCallbackUrl("/dashboard\t/evil")).toBe("/dashboard");
    });
  });
});
