# BUILD GRAPH — PULSE

Directed Acyclic Graph of Phases, Dependency Edges, Node Weights, and Acceptance Criteria.

```mermaid
graph TD
  P0[P0: Scaffold, Tooling, Design Tokens (5%)] --> P1[P1: Neon Schema, Migrations, Seed (12%)]
  P1 --> P2[P2: Auth, Sessions, RBAC Core (10%)]
  P2 --> P3[P3: Audit Engine (8%)]
  P3 --> P4[P4: Employee Directory + Profile Shell (8%)]
  P4 --> P5[P5: Bonus Module (10%)]
  P4 --> P6[P6: Review Module (10%)]
  P4 --> P7[P7: Escalation Module + Complaint Intake (12%)]
  P2 --> P9[P9: Landing Page + Auth Screens (6%)]
  P5 --> P8[P8: Role Dashboards (8%)]
  P6 --> P8
  P7 --> P8
  P8 --> P10[P10: Search, Filters, Exports, Notifications (5%)]
  P9 --> P10
  P10 --> P11[P11: Hardening: Perf, Security, A11y, Errors (4%)]
  P11 --> P12[P12: QA Sweep, Demo Seed, Deploy Readiness (2%)]
```

---

## Nodes & Acceptance Criteria

### P0 — Scaffold, Tooling, Design Tokens (5%)
- **Depends on:** —
- **Deliverables:** Next.js 15 + TS Strict + Tailwind CSS v4 + shadcn/ui components + ESLint/Prettier setup + Design tokens in `globals.css` / Tailwind + strict folder architecture (`src/app`, `src/components/ui`, `src/components/app`, `src/db`, `src/lib`, `src/server/{actions,repos,services}`, `src/types`) + `.env.example`.
- **Gate Criteria:** Clean build (`pnpm build` / `npm run build`), 0 TypeScript errors, 0 lint errors.

### P1 — Neon Schema, Migrations, Seed (12%)
- **Depends on:** P0
- **Deliverables:** Drizzle ORM schema for all §5 domains (`departments`, `users`, `bonuses`, `competencies`, `review_cycles`, `reviews`, `review_ratings`, `escalations`, `escalation_comments`, `attachments`, `audit_logs`, `notifications`, `app_settings`), migration generation scripts, idempotent `seed.ts` matching §5.3 requirements, `verify-schema.ts`.
- **Gate Criteria:** Clean migration execution, idempotent seed execution with exact row counts, check constraints and indexes present.

### P2 — Auth, Sessions, RBAC Core (10%)
- **Depends on:** P1
- **Deliverables:** NextAuth.js v5 credentials provider, password hashing (bcryptjs/argon2), JWT session with `{id, role, departmentId, fullName, email}`, middleware route guards, `can(actor, action, resource)` RBAC evaluator in `src/lib/rbac.ts`, comprehensive Vitest RBAC test suite (22 capabilities × 3 roles = 66 test vectors), `must_change_password` flow.
- **Gate Criteria:** 100% test pass on RBAC test suite, 404 response on unauthorized record probing, middleware session protection.

### P3 — Audit Engine (Cross-cutting) (8%)
- **Depends on:** P2
- **Deliverables:** `withAudit()` transactional execution helper, automated entity diffing (`before`, `after`, `changed_fields`), append-only DB protection, admin `/audit` table UI with JSON diff viewer, filters, cursor pagination, CSV export, lifecycle logging (login, failed login, logout, password change).
- **Gate Criteria:** Mutations roll back atomically if audit writes fail; audit rows accurately capture `changed_fields`.

### P4 — Employee Directory + Profile Shell (8%)
- **Depends on:** P3
- **Deliverables:** `/employees` directory with Card & Table views, debounced server search/filters, role scoping (Leads see department/reports, Users redirected), `/employees/[id]` profile with single-query consolidated header & count stats, URL-synced tabs (`?tab=overview|bonus|reviews|escalations|audit`), Overview activity timeline.
- **Gate Criteria:** Single consolidated round-trip query for profile header and stats; role access correctly restricted.

### P5 — Bonus Module (10%)
- **Depends on:** P4
- **Deliverables:** Full lifecycle bonus management (DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, PAID, CANCELLED), side-sheet create/edit form with ₹ en-IN formatting, mandatory >=10 char reason validator, mandatory rejection reason, repository-level visibility protection (employees only see APPROVED/PAID), `/bonuses` master table with summary metrics bar, bulk approval, CSV export.
- **Gate Criteria:** Reason < 10 chars rejected on client and server, employee probing unapproved bonus returns 404, all transitions write audit records.

### P6 — Review Module (10%)
- **Depends on:** P4
- **Deliverables:** Multi-step `/reviews/new` composer with competency rating scoring, auto-computed weighted mean, narrative fields (summary >=10 chars, strengths, improvements), goals builder, draft autosave (20s silent), employee acknowledgement with optional comments, radar/bar score chart on profile.
- **Gate Criteria:** Weighted competency calculation verified against fixtures; acknowledged review locked against edits; unacknowledged alert banner shown on employee dashboard.

### P7 — Escalation Module + Complaint Intake (12%)
- **Depends on:** P4
- **Deliverables:** Unified escalation engine supporting Management escalations and Employee grievance complaints, anonymous and confidential intake modes, SLA computation (`app_settings.sla_hours[severity]`) with overdue tracking, strict state machine transitions, `/escalations/[refCode]` detail view with threaded comments (Internal Note vs Shared Reply).
- **Gate Criteria:** Illegal status transitions rejected server-side, LEAD prohibited from viewing anonymous complaint creator and confidential records, zero leakage of INTERNAL comments in employee payloads.

### P8 — Role Dashboards (8%)
- **Depends on:** P5, P6, P7
- **Deliverables:** ADMIN dashboard (KPIs, 12-month bonus spend bar chart, 12-week escalation line chart, pending approvals, overdue escalations, recent audit), LEAD dashboard (team stats, pending reviews, active escalations, team roster), USER dashboard (YTD bonus summary, latest review badge, open complaints, unacknowledged review banner, quick complaint CTA).
- **Gate Criteria:** Dashboard metrics computed in <=4 efficient queries with exact reconciliation against list pages.

### P9 — Landing Page + Auth Screens (6%)
- **Depends on:** P2
- **Deliverables:** Clean, enterprise SaaS landing page (`/`) following anti-AI-slop design guidelines (no gradient meshes, no marketing fluff, crisp HTML/CSS mock showcase), `/sign-in` split view with rate limiting (5 attempts/15min) and audit logging, `/change-password` forced flow.
- **Gate Criteria:** Zero banned visual or copy elements, 100% responsive, high performance and accessibility audit.

### P10 — Search, Filters, Exports, Notifications (5%)
- **Depends on:** P8, P9
- **Deliverables:** `⌘K` global command palette (fuzzy search across employees, bonuses, escalations, quick navigation), in-app notification center with unread bell badge, CSV streaming exports with audit logging, saved table filters in localStorage, soft-delete recycle bin (`/settings/recycle-bin`) with audit-logged restore.
- **Gate Criteria:** Every export generates an audit row with filter metadata; command palette respects role-based data boundaries.

### P11 — Hardening: Perf, Security, A11y, Errors (4%)
- **Depends on:** P10
- **Deliverables:** Query plan analysis (`EXPLAIN ANALYZE`), in-memory LRU rate limiting for complaints/auth, robust Next.js error boundaries (`error.tsx`, `not-found.tsx`), keyboard shortcuts (`/`, `g d`, `g e`, `?` modal), WCAG AA contrast compliance, zero TypeScript `any` types.
- **Gate Criteria:** Clean `tsc --noEmit`, clean production build, accessible keyboard navigation.

### P12 — QA Sweep, Demo Seed, Deploy Readiness (2%)
- **Depends on:** P11
- **Deliverables:** 4 critical Playwright E2E test flows, deployment configuration (Vercel/Neon), comprehensive `README.md` with zero-to-running documentation, demo credentials.
- **Gate Criteria:** 100% test pass on Playwright test suite and clean fresh clone boot.
