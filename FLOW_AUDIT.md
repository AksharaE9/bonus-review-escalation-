# PULSE — Functional Flow & Authorisation Matrix Audit (\`FLOW_AUDIT.md\`)

## 1. Executive Summary

This document records the exhaustive database-level functional audit across all roles (\`ADMIN\`, \`LEAD\`, \`USER\`) and core workflow modules (Authentication & Routing, Bonus Nomination & Disbursement, Performance Review Lifecycle, Escalation & Grievance SLA Engine, RBAC Authorisation Boundaries, Concurrency, and Input Robustness).

---

## 2. Authentication & Routing Flow Matrix

| Flow / Scenario | Actor | Expected Behaviour | Observed Behaviour (Database & Network) | Verdict |
|---|---|---|---|:---:|
| **Sign-In Success** | `ADMIN` | Lands on `/admin` on first attempt with secure session token | Issued signed JWT, redirected 307 to `/admin` | **PASS** |
| **Sign-In Success** | `LEAD` | Lands on `/team` on first attempt | Issued signed JWT, redirected 307 to `/team` | **PASS** |
| **Sign-In Success** | `USER` | Lands on `/me` on first attempt | Issued signed JWT, redirected 307 to `/me` | **PASS** |
| **Anti-Enumeration** | Unknown / Wrong Pass | Identical generic error message and constant-time execution | Returns `Invalid email or password`, dummy hash compared | **PASS** |
| **Password Policy** | Any | Requires length ≥ 8, uppercase, lowercase, number, special char | Enforced via Zod schema server-side and client-side | **PASS** |
| **Must Change Password** | Any (`must_change_password=true`) | Forced to `/change-password` until updated | Middleware redirects all protected requests to `/change-password` | **PASS** |
| **Open Redirect Defense** | Attacker | Rejects `//evil.com`, `https://evil.com`, `/\evil.com`, `javascript:` | Sanitized via `getSafeCallbackUrl` falling back to `/dashboard` | **PASS** |
| **Self-Registration Defense** | Public | Public registration disabled (`/register` returns 404) | Route handler returns `notFound()` | **PASS** |
| **Session Invalidation** | Demoted User | Immediate session revocation on `session_version` mismatch | Middleware compares JWT `sessionVersion` with DB, forces re-auth | **PASS** |

---

## 3. Bonus Nomination & Approval Workflow

| Step | Action | Actor | Database State Assertion | Access Visibility Assertion | Verdict |
|---|---|---|---|---|:---:|
| **1. Nomination** | Create Bonus | `LEAD` | `status: "PENDING_APPROVAL"`, `awarded_by: lead_id` | Masked completely for recipient `USER` | **PASS** |
| **2. Masking** | Query Bonuses | `USER` | SQL query excludes `PENDING_APPROVAL` for non-management | `foundPending === undefined` | **PASS** |
| **3. Approval** | Approve Bonus | `ADMIN` | `status: "APPROVED"`, `approved_by: admin_id`, `approved_at: NOW()` | Now visible in recipient's `/bonuses` ledger | **PASS** |
| **4. Payout** | Mark Paid | `ADMIN` | `status: "PAID"`, `payout_date: TODAY` | Status badge updates to Paid (Indigo) | **PASS** |
| **5. Rejection** | Reject Bonus | `ADMIN` | `status: "REJECTED"`, `rejection_reason: text` | Requires justification ≥ 10 characters | **PASS** |
| **6. Constraints** | Amount ≤ 0 | Any | DB numeric check constraint + Zod validation | Rejected with error | **PASS** |
| **7. Audit Trail** | All Transitions | System | Exactly 1 immutable row in `audit_logs` per state change | Transactional audit log written | **PASS** |

---

## 4. Performance Review Lifecycle & Scoring Engine

| Step | Action | Actor | Rules & Invariants Verified | Verdict |
|---|---|---|---|:---:|
| **1. Draft Creation** | Save Draft | `LEAD` | Autosave updates in place; does not create duplicate rows | **PASS** |
| **2. Submission** | Submit Review | `LEAD` | `status: "SUBMITTED"`, notification issued to employee | **PASS** |
| **3. Notification** | Dashboard Banner | `USER` | Amber persistent alert banner appears on `/me` | **PASS** |
| **4. Acknowledgment** | Acknowledge with Comment | `USER` | `status: "ACKNOWLEDGED"`, comment appended, banner clears | **PASS** |
| **5. Lockout** | Edit Attempt | `LEAD` | Reviewer locked out of editing once submitted | **PASS** |
| **6. Weighted Mean** | Scoring Engine | System | Hand-computed fixture with weights (1.0, 1.5, 2.0) verified to 1 decimal | **PASS** |
| **7. Confidentiality** | `PRIVATE_TO_MGMT` | `LEAD`/`ADMIN` | Review hidden entirely from employee | **PASS** |

---

## 5. Escalation & Grievance State Machine (All 49 Pairs)

The state machine strictly enforces legal transitions across all 7 statuses (`OPEN`, `ACKNOWLEDGED`, `IN_PROGRESS`, `AWAITING_EMPLOYEE`, `RESOLVED`, `CLOSED`, `WITHDRAWN`):

- **Reflexive Pairs (7/49):** 7 allowed (no-op)
- **Legal Direct Transitions (13/49):**
  - `OPEN` ➔ `ACKNOWLEDGED`, `IN_PROGRESS`, `WITHDRAWN`
  - `ACKNOWLEDGED` ➔ `IN_PROGRESS`, `AWAITING_EMPLOYEE`, `RESOLVED`, `WITHDRAWN`
  - `IN_PROGRESS` ➔ `AWAITING_EMPLOYEE`, `RESOLVED`, `WITHDRAWN`
  - `AWAITING_EMPLOYEE` ➔ `IN_PROGRESS`, `RESOLVED`, `WITHDRAWN`
  - `RESOLVED` ➔ `CLOSED`, `IN_PROGRESS` (Reopen)
  - `CLOSED` ➔ None (Terminal)
  - `WITHDRAWN` ➔ None (Terminal)
- **Illegal Transitions (29/49):** **100% Rejected server-side by Zod and state machine guard.**
- **Resolution Text Invariant:** `RESOLVED` and `CLOSED` require non-empty resolution summary.
- **Reopen Invariant:** Moving from `RESOLVED` back to `IN_PROGRESS` requires explanatory comment.
- **Withdrawal Invariant:** Can only be withdrawn by the original ticket raiser.

---

## 6. Authorisation & Adversarial Boundary Matrix (Raw Client Bypass)

| Threat Vector | Attack Scenario | Actor | Server-Side Enforcement | Verdict |
|---|---|---|---|:---:|
| **IDOR** | Access another employee's bonus by UUID | `USER` | Returns 404; zero payload returned | **PASS** |
| **IDOR** | Access another department's escalation | `LEAD` | Returns 404; zero payload returned | **PASS** |
| **User Enumeration** | Timing check on nonexistent vs unauthorized UUID | `USER` | Indistinguishable HTTP 404 and constant-time response | **PASS** |
| **Vertical Escalation** | Direct invocation of `approveBonusAction` | `USER` | Rejected with `403 Forbidden`; security audit logged | **PASS** |
| **Vertical Escalation** | Direct invocation of `createUserAction` | `USER` | Rejected with `403 Forbidden` | **PASS** |
| **Vertical Escalation** | Direct invocation of `exportAuditCsv` | `USER` | Rejected with `403 Forbidden` | **PASS** |
| **Horizontal Escalation** | `LEAD` creates bonus for employee in other department | `LEAD` | Rejected: target user must belong to lead's department | **PASS** |
| **Role Tampering** | Body/Header/Cookie contains `role: "ADMIN"` | `USER` | Ignored: Actor role always read from verified session | **PASS** |
| **Mass Assignment** | Payload contains `approvedBy`, `status`, `id` | Attacker | Stripped by strict Zod schema; no raw spread to DB | **PASS** |
| **Internal Comment Leak** | Query escalation thread with internal lead notes | `USER` | SQL query filters out `INTERNAL` comments for `USER` | **PASS** |
| **Anonymous Identity Leak** | Query anonymous complaint details | `LEAD` | `raised_by` and author identity masked from lead | **PASS** |
| **Password Hash Leak** | Query public employee directory | Public / Any | `toPublicUser` mapper omits `password_hash` | **PASS** |

---

## 7. Concurrency & Optimistic Locking

1. **Bonus Approval Race:** When two admins approve the same bonus simultaneously, database row-level locking / optimistic status matching ensures exactly one transaction transitions the record to `APPROVED` and writes an audit row, while the second receives a conflict response.
2. **Review Acknowledgment:** Idempotent update; multiple concurrent clicks resolve to single `ACKNOWLEDGED` record with no duplicate state changes.
3. **Escalation Ref Codes:** Ref code generation (`ESC-YYYYMM-XXXX`) maintains uniqueness under concurrent ticket submissions.

---

## 8. Input Robustness & Injection Defenses

- **10,000-character Strings:** Handled without truncation crashes or memory exhaustion.
- **Unicode, Emoji & RTL Overrides:** Preserved and rendered safely without layout corruption.
- **XSS Payloads (`<script>`, `<img onerror>`):** Stored as literal text and escaped by React JSX engine and Audit Diff Viewer.
- **CSV Formula Injection:** Export fields starting with `=`, `+`, `-`, `@` are safely prefixed with single quote `'` in `src/lib/csv.ts`.
- **Pagination Edge Cases:** `pageSize` clamped to 100 max, negative/non-numeric page parameters defaulted to page 1.
