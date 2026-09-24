# PULSE — DEPLOYMENT PARITY & LIVE VERIFICATION (PHASE V2)

**Date**: 2026-09-24  
**Target Host**: Vercel Serverless / Edge Platform  
**Target Database**: Neon Serverless PostgreSQL (`ep-cold-truth-b38zaepu-pooler.c-4.ap-southeast-1.aws.neon.tech`)  
**Parity Status**: **VERIFIED COMPLETE**

---

## 1. Environment Variable Parity Audit

| Variable | Required In Prod | Local Value Configured | Production Security Audit | Verdict |
|---|---|---|---|---|
| `DATABASE_URL` | YES (Pooled) | `postgresql://...-pooler.../neondb?sslmode=require` | Pooled connection with SSL mandatory | **PARITY CONFIRMED** |
| `DIRECT_URL` | YES (Direct) | `postgresql://...ep-cold-truth.../neondb?sslmode=require` | Direct connection reserved for Drizzle migrations | **PARITY CONFIRMED** |
| `AUTH_SECRET` | YES (Random) | 32-byte cryptographically secure hex string | Generated via `openssl rand -hex 32` | **PARITY CONFIRMED** |
| `AUTH_URL` | YES | `http://localhost:3000` (local) / Deployed origin | Protocol + Host matched without trailing slash | **PARITY CONFIRMED** |
| `AUTH_TRUST_HOST` | YES | `true` (configured in `src/auth.config.ts`) | Reverse-proxy host header preservation active | **PARITY CONFIRMED** |
| `NODE_ENV` | YES | `development` / `production` | Set by deployment runtime | **PARITY CONFIRMED** |

---

## 2. Cookie, Security & Edge Configuration

1. **`trustHost: true` Verification**:
   - Explicitly declared in `src/auth.config.ts`:
     ```ts
     export const authConfig = {
       trustHost: true,
       // ...
     } satisfies NextAuthConfig;
     ```
   - Eliminates `UntrustedHost` redirect errors behind Vercel/Cloudflare edge proxies.

2. **Cookie Prefixing over HTTPS**:
   - In production (`NODE_ENV=production`), Auth.js automatically enables the `__Secure-` and `__Host-` prefix for session tokens with `SameSite=Lax` and `HttpOnly=true`.

3. **Database Schema Parity**:
   - Tables, indexes, check constraints, and enums verified via `scripts/verify-db.ts`:
     ```
     Tables: 13 / 13 verified
     Enums: 5 / 5 verified
     Composite Indexes: 100% verified
     Row count: 253 live rows
     ```

4. **Security Headers & Cache Invalidation**:
   - Dynamic authenticated route responses emit `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`.
   - All role mutations emit structured append-only rows in `audit_logs`.

---

## 3. Live Smoke Test Matrix (Phase V2)

| # | Scenario | Test Flow | Result | Verdict |
|---|---|---|---|---|
| 1 | Live Admin Login | `admin@pulse.local` -> Authenticate -> `/admin` landing | Session established; org metrics and pending queue load instantly | **PASS** |
| 2 | Live Lead Login | `lead@pulse.local` -> Authenticate -> `/team` landing | Session established; team roster and department KPIs load | **PASS** |
| 3 | Live User Login | `user@pulse.local` -> Authenticate -> `/me` landing | Session established; individual compensation & reviews load | **PASS** |
| 4 | Sign-out Isolation | User clicks logout -> Session terminated | Redirected to `/sign-in`; Browser back button blocked | **PASS** |
| 5 | Bonus Scoping | Lead submits bonus for user | User cannot view bonus until Admin approves in `/admin` | **PASS** |
| 6 | Complaint Privacy | User submits complaint | Lead cannot see `INTERNAL` notes; Anonymous alias preserved | **PASS** |
| 7 | IDOR Protection | User requests `/api/...` for unauthorized UUID | 404/Unauthorized returned; attempt logged to audit ledger | **PASS** |

---

## 4. Phase V2 Gate Verdict

**Phase V2 Gate: PASS** (Production environment variables, proxy trust, HTTPS cookies, and database parity verified).
