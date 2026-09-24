# Pulse — Adversarial Audit & Hardening Graph

```
A0 ─┬─► A1 ─┐
    └─► A2 ─┼─► A3 ─► A4 ─┬─► A5 ─┐
            │             │       ├─► A9 ─► A10 ─► A11 ─► A12
            └─► A6 ───────┘       │
                A7 ───────────────┤
                A8 ───────────────┘
```

## Graph Nodes & Weights

| Node | Name | Weight | Dependencies | Gate Criteria |
|---|---|:---:|---|---|
| **A0** | Test harness, Neon test branch, baseline capture | 6% | — | Vitest unit/int runners configured, baseline captured in `PERF_BASELINE.md` |
| **A1** | Static analysis, types, dependency & secret scan | 5% | A0 | Zero TS errors, zero lint errors, zero secrets, zero layering leaks |
| **A2** | Schema, constraint & data-integrity audit | 8% | A0 | DB-level constraint tests, money precision, append-only audit & rollback verified |
| **A3** | Unit + integration functional suite | 10% | A1, A2 | Full lifecycle coverage for Bonus, Review, Escalation + Concurrency |
| **A4** | AuthZ / RBAC adversarial matrix | 12% | A3 | Direct action testing across 4 roles × all endpoints, 0 IDOR, 0 leaks (I1–I12) |
| **A5** | End-to-end journey suite | 10% | A4 | Multi-role Playwright browser flows green × 3 |
| **A6** | Security audit (OWASP-aligned) | 15% | A2, A4 | Injection, CSRF, rate limits, CSV injection, sanitization verified |
| **A7** | Performance: DB, server, client, load | 14% | A4 | Query budgets, N+1 elimination, Neon cold start discipline, bundle budgets |
| **A8** | Accessibility audit (WCAG 2.1 AA) | 6% | A5 | Keyboard walkthrough, contrast, aria attributes, focus management |
| **A9** | Resilience, error handling & edge cases | 5% | A5, A6 | Fault injection, boundary recovery, double-submit protection, edge fuzzing |
| **A10** | Observability, logging & audit-trail verification | 3% | A5 | Complete mutation audit sweep, request_id correlation, /api/health |
| **A11** | Remediation loop closure & full regression | 4% | A6, A7, A8, A9, A10 | Zero open S0/S1/S2 findings, full suite clean × 3 consecutive runs |
| **A12** | Production readiness certification | 2% | A11 | `PRODUCTION_READINESS.md` certified with final sign-off block |
