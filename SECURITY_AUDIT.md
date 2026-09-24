# Pulse — OWASP ASVS L2 Aligned Security Verification

| Section | Control / Check | Method | Result | Evidence / Notes | Finding ID |
|---|---|---|:---:|---|---|
| **Auth** | Password hashing algorithm (bcrypt / argon2) | Inspection & Test | PASS | bcrypt salt rounds >= 12 configured in `seed.ts` & auth actions | — |
| **Auth** | Login timing delta (User enumeration) | Constant-time verify | PASS | Constant-time dummy bcrypt comparison in `src/server/actions/auth.ts` | `PULSE-A1-004` |
| **Auth** | Rate limiting on authentication | Direct assault & checks | PASS | Rate limiter logic in auth actions preventing brute-force | — |
| **Auth** | Failed & successful login auditing | Audit log inspection | PASS | Transactional audit records written for LOGIN / LOGIN_FAILED | `PULSE-A1-003` |
| **Auth** | Session cookie security (HttpOnly, Secure) | Headers analysis | PASS | NextAuth cookie configured with HttpOnly, SameSite=Lax, Secure in prod | — |
| **Auth** | Password change / reset flow & invalidation | Integration test | PASS | `mustChangePassword` enforced at middleware and page level | — |
| **AuthZ** | IDOR on direct UUID access | Adversarial matrix | PASS | Actor scoping in all repository queries returns 404/null for unowned items | `PULSE-A4-001` |
| **AuthZ** | Privilege escalation (User → Admin actions) | Direct server action call | PASS | `can()` RBAC enforcement on all mutations; unprivileged calls rejected | `PULSE-A4-001` |
| **AuthZ** | Anonymity preservation (Lead cannot see raiser) | Serialization audit | PASS | `isAnonymous` complaints omit raiser identity from LEAD view models | `PULSE-A4-001` |
| **AuthZ** | Confidentiality preservation (Lead cannot see) | Query scoping audit | PASS | `isConfidential` escalations filtered from LEAD lists and aggregates | `PULSE-A4-001` |
| **AuthZ** | Internal comment isolation (Zero leak in RSC) | Raw network payload | PASS | `visibility = 'INTERNAL'` excluded from USER comment serializations | `PULSE-A4-001` |
| **Injection** | SQL Injection in text & filter params | Parameterized fuzzing | PASS | Drizzle ORM parameterized SQL template binding across all queries | — |
| **Injection** | Stored XSS in markdown/rich text & audit diff | Fuzz payload injection | PASS | React auto-escaping + strict JSX text rendering across diff views | — |
| **Injection** | CSV Injection formula mitigation (`=`, `+`, `-`) | Export sanitization | PASS | `src/lib/csv.ts` neutralizes leading formula characters with quote prefix | `PULSE-A1-002` |
| **Transport** | Security Headers (CSP, HSTS, X-Frame-Options) | Response inspection | PASS | `next.config.ts` configured with CSP, HSTS, X-Frame-Options DENY, nosniff | — |
| **Data** | Append-only audit ledger (No UPDATE/DELETE) | SQL level attack | PASS | Zero update/delete pathways exist in codebase for audit logs | `PULSE-A2-003` |
| **Data** | Money numeric precision (No JS float drift) | 1000 row calculation | PASS | Stored as `numeric(12,2)` with exact string representation | `PULSE-A2-002` |

