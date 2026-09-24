# Pulse — Audit Findings Ledger

> Format: `PULSE-<PHASE>-<NNN>` · Severity: S0 (Critical), S1 (High), S2 (Medium), S3 (Low)

| ID | Sev | Phase | Title | Status | Root Cause Layer | Verifying Test |
|---|---|---|---|---|---|---|
| `PULSE-R-001` / `REDIRECT-001` | S0 | R0/B2 | Client-side `signIn("credentials", { redirect: false })` + `router.push()` stalled navigation | RESOLVED | action/client | `tests/auth-lifecycle.test.ts` & `SignInClient.tsx` |
| `PULSE-R-002` / `REDIRECT-SEC-001` | S0 | R0/B2 | Open `/register` route allowed unauthorized creation of accounts | RESOLVED | security/route | `tests/registration-and-approval.test.ts` |
| `PULSE-R-003` / `REDIRECT-SEC-002` | S1 | R0/B2 | Lack of `sessionVersion` allowed demoted users to maintain elevated permissions | RESOLVED | auth/schema | `tests/auth-lifecycle.test.ts` |
| `PULSE-A1-001` | S1 | A1 | Unescaped JSX, loose typing, empty interface linter issues | RESOLVED | component | `next lint` (0 errors, 0 warnings) |
| `PULSE-A1-002` | S1 | A1 | CSV Formula Injection vulnerability in Export APIs | RESOLVED | service | `src/lib/csv.test.ts` |
| `PULSE-A1-003` | S0 | A1 | Sensitive field exposure in audit payloads | RESOLVED | service | `src/lib/audit.test.ts` |
| `PULSE-A1-004` | S1 | A1 | Login timing user enumeration oracle | RESOLVED | action | `src/lib/rbac.test.ts` & auth constant-time verify |
| `PULSE-A2-001` | S1 | A2 | Schema constraints for non-positive bonus amounts and min lengths | RESOLVED | schema | `tests/schema-constraints.test.ts` |
| `PULSE-A2-002` | S1 | A2 | Exact money numeric(12,2) precision without float drift | RESOLVED | schema/service | `tests/schema-constraints.test.ts` |
| `PULSE-A3-001` | S1 | A3 | Escalation state machine transition completeness (49 pairs) | RESOLVED | service | `tests/functional-and-adversarial.test.ts` |
| `PULSE-A3-002` | S1 | A3 | Review competency weighted overall rating calculation | RESOLVED | service | `tests/functional-and-adversarial.test.ts` |
| `PULSE-A4-001` | S0 | A4 | Authoritative RBAC isolation across USER/LEAD/ADMIN (I1-I8) | RESOLVED | service/repo | `tests/functional-and-adversarial.test.ts` & `src/lib/rbac.test.ts` |
| `PULSE-A4-002` | S0 | A4 | Prevention of password_hash leak in mapper layer (I12) | RESOLVED | mapper | `tests/functional-and-adversarial.test.ts` |
