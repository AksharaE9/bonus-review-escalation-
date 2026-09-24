import type { Role } from "@/types";

export const ROLE_LANDING = {
  ADMIN: "/admin",
  LEAD: "/team",
  USER: "/me",
} as const satisfies Record<Role, string>;

/**
 * Validates and sanitizes callback URLs to prevent open redirect vulnerabilities.
 * Accepts only valid same-origin relative paths starting with a single '/'
 * Rejects protocol-relative ('//'), backslash bypasses ('/\'), URI schemes ('javascript:', 'https:'),
 * and control characters.
 */
export function getSafeCallbackUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== "string") {
    return "/dashboard";
  }

  const trimmed = rawUrl.trim();

  // Must start with '/'
  if (!trimmed.startsWith("/")) {
    return "/dashboard";
  }

  // Reject protocol-relative '//', backslash escape '/\', or encoded variants
  if (
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.includes("\\")
  ) {
    return "/dashboard";
  }

  // Reject URI schemes and control characters
  if (
    trimmed.includes(":") ||
    trimmed.includes("\r") ||
    trimmed.includes("\n") ||
    trimmed.includes("\t") ||
    trimmed.includes("\0")
  ) {
    return "/dashboard";
  }

  return trimmed;
}
