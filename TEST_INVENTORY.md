# Pulse — Test Inventory & Requirement Mapping

| Test File | Test Suite Name | Invariant / Requirement Mapped | Type |
|---|---|---|:---:|
| `src/lib/rbac.test.ts` | Authoritative RBAC Capability Evaluator | I1, I2, I3, I6, I7, I8 (§9 RBAC Matrix) | Unit |
| `src/lib/audit.test.ts` | Audit Engine & Transactional Wrapper | I4, I5 (Atomic mutation + audit) | Unit |
| `src/lib/csv.test.ts` | CSV Formula Injection Neutralizer | §9.3 (Injection / Export Safety) | Unit |
| `src/lib/validators/bonus.test.ts` | Bonus Validation & Currency | I9, I11 (Reason min 10 chars, > 0 INR) | Unit |
| `src/lib/validators/review.test.ts` | Review Competency & Weighted Scores | §8.6 (Weighted score math) | Unit |
| `src/lib/validators/escalation.test.ts` | Escalation State Machine & Validation | I10, I11 (Transitions, Resolution mandatory) | Unit |
| `tests/schema-constraints.test.ts` | Schema Constraints & Precision Invariants | I5, I9, I11 (Schema Checks & Numbers) | Integration |
| `tests/functional-and-adversarial.test.ts` | Lifecycle & RBAC Matrix Adversarial Proofs | I1, I2, I3, I6, I7, I8, I10, I12 | Integration |
| `tests/pulse.spec.ts` | Core End-to-End User Journeys | §11 (4 E2E Workflows) | E2E |

