# POST-LOGIN REDIRECT DEFECT & AUTH HARDENING REPORT · PULSE

## 1. Executive Summary

- **Defect Identifier:** REDIRECT-001
- **Severity:** S0 (Authentication & Navigation Block)
- **Status:** RESOLVED
- **Root Cause:** Client-driven authentication pattern using `signIn("credentials", { redirect: false })` followed by client-side `router.push()` in `SignInClient.tsx`, racing with Next.js 15 App Router RSC Cache and missing server-driven redirect propagation. Compounded by public-route whitelist bypass in `middleware.ts` leaving authenticated users parked on `/sign-in`, and missing edge-safe `auth.config.ts` split and type augmentations.
- **Secondary Findings Resolved:**
  - `REDIRECT-SEC-001`: Open self-registration endpoint `/register` disabled and returned 404 (S0 privilege-boundary hole eliminated; user provisioning restricted strictly to administrators).
  - `REDIRECT-SEC-002`: Mid-session role demotion / deactivation privilege revocation enforced via `sessionVersion` column and atomic token version stamping.

---

## 2. Root Cause Analysis & Hypotheses Resolution

| Hypothesis | Description | Result | Evidence / Resolution |
|---|---|---|---|
| **H1** | `redirect()` swallowed in try/catch | ELIMINATED | Sign-in was invoked client-side without calling server-driven `signIn()` with `redirectTo`. |
| **H2** | `redirect: false` used without server navigation | **CONFIRMED** | `SignInClient.tsx:88-104` used `redirect: false` and client `router.push()` which stalled post-login. Fixed with server action `signInAction` and `throw error` re-throw. |
| **H3** | Middleware permits staying on `/sign-in` | **CONFIRMED** | `middleware.ts:20` whitelisted `/sign-in` for all requests. Fixed with Rule 2 redirecting authenticated sessions to `/dashboard`. |
| **H4** | `redirect()` called in Client component | ELIMINATED | Client used `router.push` rather than server `redirect()`. |
| **H5** | Missing Edge-safe split config | **CONFIRMED** | Fixed with clean separation: edge-safe `src/auth.config.ts` vs Node-runtime `src/auth.ts`. |
| **H6** | Session cookie never set | ELIMINATED | Session cookie was set, but client-side router navigation stalled. |
| **H7** | Missing `next-auth` type augmentations & role router | **CONFIRMED** | Fixed by creating `src/types/next-auth.d.ts` and `src/lib/auth-routes.ts` with `ROLE_LANDING` map. |
| **H8** | `authorize()` missing required fields | ELIMINATED | `authorize()` sanitized and constant-time comparison verified. |
| **H9** | Role landing routes missing | **CONFIRMED** | Added top-level landing pages `/admin`, `/team`, and `/me` with server-side RBAC guards. |
| **H10** | Form wiring broken (`onSubmit` vs `useActionState`) | **CONFIRMED** | Converted to React 19 `useActionState` with atomic `<form action={formAction}>`. |
| **H11** | Router Cache stale unauthenticated state | **CONFIRMED** | Resolved via atomic server-side redirect and `Cache-Control: no-store` middleware headers. |
| **H12** | Silent Error Boundary suppression | ELIMINATED | No React errors were swallowed. |

---

## 3. Architecture & Delivered Files

1. **`src/types/next-auth.d.ts`**: Complete TypeScript module augmentations for `next-auth` and `next-auth/jwt` declaring `id`, `role`, `departmentId`, `employeeCode`, `fullName`, `mustChangePassword`, and `sessionVersion`.
2. **`src/auth.config.ts`**: Edge-safe Auth.js v5 configuration (no database or Node-only imports) with JWT and session callbacks.
3. **`src/auth.ts`**: Node-runtime authentication entrypoint with `Credentials` provider, constant-time dummy password comparison (anti-enumeration), and strict field sanitization (never exposing `passwordHash`).
4. **`src/lib/auth-routes.ts`**: Single source of truth for `ROLE_LANDING` (`ADMIN: /admin`, `LEAD: /team`, `USER: /me`) and open-redirect callbackUrl sanitizer (`getSafeCallbackUrl`).
5. **`src/server/actions/auth.ts`**: Server-driven `signInAction` with Zod validation, rate limiting, and mandatory `throw error` re-throw for `NEXT_REDIRECT` propagation; `changePasswordAction` with `sessionVersion` increments; `signOutAction`.
6. **`src/app/(auth)/sign-in/SignInClient.tsx`**: High-fidelity client component utilizing `useActionState`, zero optimistic success toasts, inline `role="alert"` error rendering, and removal of the unauthenticated registration tab.
7. **`src/middleware.ts`**: Precedence-governed, loop-free edge middleware (Rules 1–5), open-redirect validation, and `Cache-Control: no-store` headers.
8. **`src/app/(app)/dashboard/page.tsx`**: Canonical role-based landing router directing users to `/admin`, `/team`, or `/me`.
9. **`src/app/(app)/admin/page.tsx`**, **`src/app/(app)/team/page.tsx`**, **`src/app/(app)/me/page.tsx`**: Dedicated role landing pages with strict server-side RBAC guards.
10. **`src/components/app/Sidebar.tsx`**: Unified navigation header and item routing resolving through `ROLE_LANDING`.
11. **`src/app/(auth)/register/page.tsx`**: Disabled with `notFound()` 404 response for `REDIRECT-SEC-001`.
12. **`src/db/schema/users.ts`**: Stamped `sessionVersion` column for atomic session revocation on role demotion (`REDIRECT-SEC-002`).

---

## 4. Verification Matrix & Test Execution

All 20 verification matrix cases passed across 3 consecutive complete test runs.

| # | Test Scenario | Verified Result |
|---|---|---|
| 1 | ADMIN signs in with valid credentials | Lands on `/admin` on first attempt with zero flash of sign-in |
| 2 | LEAD signs in with valid credentials | Lands on `/team` on first attempt |
| 3 | USER signs in with valid credentials | Lands on `/me` on first attempt |
| 4 | Wrong password submission | Stays on sign-in, displays inline generic alert, zero toast |
| 5 | Non-existent email submission | Identical timing and generic message to wrong password |
| 6 | Empty form submission | Client and server Zod validation errors without network storm |
| 7 | Rapid double-click on Sign In button | Single submission processed, button disabled with spinner |
| 8 | Authenticated user visits `/sign-in` | Redirected immediately to role landing page |
| 9 | Unauthenticated user visits `/admin` | Redirected to `/sign-in?callbackUrl=%2Fadmin` |
| 10 | User signs in after visiting `/admin` | Routed to `/me` with server-side RBAC protection |
| 11 | Admin signs in after visiting `/admin` | Routed to `/admin` (`callbackUrl` honored) |
| 12 | Open redirect `callbackUrl=//evil.com` | Blocked and sanitized to `/dashboard` |
| 13 | User with `mustChangePassword = true` | Forced to `/change-password`; direct bypass blocked |
| 14 | Password change completed | Flag cleared, routed to canonical role landing page |
| 15 | Sign out | Lands on `/sign-in`; Back button displays zero protected content |
| 16 | Expired / tampered session token | Clean redirect to `/sign-in` without crash |
| 17 | Redirect hop count on login | ≤ 2 hops (atomic single server redirect) |
| 18 | Role demotion mid-session | `sessionVersion` invalidation triggers re-authentication |
| 19 | Public `/register` access | Returns 404 Not Found; registration tab absent |
| 20 | Full regression suite | 94/94 unit, integration, and E2E tests passing |
