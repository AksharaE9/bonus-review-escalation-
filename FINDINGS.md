# Pulse — Audit Findings Ledger

> Format: `PULSE-<PHASE>-<NNN>` · Severity: S0 (Critical), S1 (High), S2 (Medium), S3 (Low)

| ID | Sev | Phase | Title | Status | Root Cause Layer | Verifying Test |
|---|---|---|---|---|---|---|
| `PULSE-A1-001` | S1 | A1 | Unescaped JSX, loose typing, empty interface linter issues | VERIFIED | component | `eslint . --max-warnings=0` |
| `PULSE-A1-002` | S1 | A1 | CSV Formula Injection vulnerability in Export APIs | VERIFIED | service | `src/lib/csv.test.ts` |
| `PULSE-A1-003` | S0 | A1 | Sensitive field exposure in audit payloads | VERIFIED | service | `src/lib/audit.test.ts` |
| `PULSE-A1-004` | S1 | A1 | Login timing user enumeration oracle | VERIFIED | action | `src/lib/rbac.test.ts` & auth constant-time verify |
| `PULSE-A2-001` | S1 | A2 | Schema constraints for non-positive bonus amounts and min lengths | VERIFIED | schema | `tests/schema-constraints.test.ts` |
| `PULSE-A2-002` | S1 | A2 | Exact money numeric(12,2) precision without float drift | VERIFIED | schema/service | `tests/schema-constraints.test.ts` |
| `PULSE-A3-001` | S1 | A3 | Escalation state machine transition completeness (49 pairs) | VERIFIED | service | `tests/functional-and-adversarial.test.ts` |
| `PULSE-A3-002` | S1 | A3 | Review competency weighted overall rating calculation | VERIFIED | service | `tests/functional-and-adversarial.test.ts` |
| `PULSE-A4-001` | S0 | A4 | Authoritative RBAC isolation across USER/LEAD/ADMIN (I1-I8) | VERIFIED | service/repo | `tests/functional-and-adversarial.test.ts` & `src/lib/rbac.test.ts` |
| `PULSE-A4-002` | S0 | A4 | Prevention of password_hash leak in mapper layer (I12) | VERIFIED | mapper | `tests/functional-and-adversarial.test.ts` |
