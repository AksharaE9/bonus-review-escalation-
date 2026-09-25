# PULSE — Clean-State Reset & Account Inventory Report (`DATA_RESET_REPORT.md`)

## 1. Executive Summary

Pulse production database has undergone an idempotent clean-state reset. All fake, synthetic, and duplicated business demo data have been wiped. Reference configurations (competencies, review cycle structure, system settings) are preserved. Exactly three production accounts (Admin, Lead, User) have been provisioned with coherent hierarchy and reporting relationships.

---

## 2. Before & After Table Inventory

| Table Name | Description / Classification | Pre-Reset Count | Post-Reset Count | Action Taken |
|---|---|---|---|---|
| `users` | User accounts | 30 | **3** | Provisioned 1 ADMIN, 1 LEAD, 1 USER |
| `departments` | Organizational units | 3 | **1** | Retained "Engineering" (Code: ENG) |
| `bonuses` | Merit & spot bonus records | 43 | **0** | Purged |
| `reviews` | Performance appraisals | 18 | **0** | Purged |
| `review_ratings`| Competency score breakdowns | 144 | **0** | Purged |
| `competencies` | Reference competency dictionary | 8 | **8** | Preserved reference config |
| `escalations` | Grievance & escalation tickets | 42 | **0** | Purged |
| `escalation_comments` | Internal & shared discussion | 26 | **0** | Purged |
| `notifications` | In-app user notifications | 0 | **0** | Purged |
| `attachments` | Escalation evidence files | 0 | **0** | Purged |
| `audit_logs` | Security & mutation ledger | 1 | **3** | Clean baseline: 3 account creation records |
| `app_settings` | Global platform parameters | 6 | **6** | Preserved system config |

---

## 3. Production Account Topology

| Role | Email | Employee Code | Department | Manager | Credentials Policy | Must Change Password |
|---|---|---|---|---|---|---|
| **ADMIN** | `admin@pulse.internal` | `PULSE-001` | Engineering | — | bcrypt (12 rounds) | `true` |
| **LEAD** | `lead@pulse.internal` | `PULSE-002` | Engineering (Lead) | — | bcrypt (12 rounds) | `true` |
| **USER** | `user@pulse.internal` | `PULSE-003` | Engineering | `PULSE-002` (Lead) | bcrypt (12 rounds) | `true` |

> [!NOTE]
> All credentials are set via environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, etc.) and are never checked into git or visible in the UI.

---

## 4. Audit Log Append-Only Guarantee

1. **Wiping Exception:** The audit log reset performed during this phase was a one-time pre-launch provisioning procedure.
2. **Application Integrity:** The application source code contains **zero** `DELETE` or `TRUNCATE` operations on `audit_logs`. Every subsequent action (login, bonus creation, approval, escalation status change) is append-only with actor attribution, timestamp, IP address, and request ID tracking.
