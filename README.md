# Pulse — Employee Bonus, Review & Escalation Management System

> **Pulse** is an enterprise people-operations console where management records and employees track **Bonuses**, **Performance Reviews**, and **Escalations** — backed by an append-only, tamper-evident audit trail.

---

## 1. Locked Tech Stack

- **Framework:** Next.js 15 (App Router, Server Components & Server Actions, React 19)
- **Styling:** Tailwind CSS v4, custom design tokens in `globals.css` (Inter font, tabular numerals, hairline borders)
- **Component Primitives:** shadcn/ui (Radix UI)
- **Icons:** `lucide-react`
- **Charts:** `recharts` (12-month bonus spend bar chart & 12-week escalation resolution velocity)
- **Database:** Neon Serverless PostgreSQL
- **ORM & Migrations:** Drizzle ORM (`drizzle-kit` versioned migrations) + `@neondatabase/serverless`
- **Authentication & RBAC:** Auth.js v5 (NextAuth Credentials Provider + JWT Session + Server-side RBAC scoping)
- **Validation:** Zod schemas shared across client forms and server actions
- **Forms & Tables:** `react-hook-form` + `@tanstack/react-table`
- **Dates & Currency:** `date-fns` & `date-fns-tz` (`Asia/Kolkata`) + `Intl.NumberFormat('en-IN')` (₹)
- **Testing:** Vitest (unit / schema / RBAC matrix) + Playwright (E2E)

---

## 2. Quickstart & Local Setup

### 2.1 Prerequisites
- Node.js 20+
- Neon PostgreSQL connection string (or compatible PostgreSQL 15+ database)

### 2.2 Environment Setup
Copy `.env.example` to `.env` and provide your database credentials:

```bash
cp .env.example .env
```

```env
DATABASE_URL=postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/pulse?sslmode=require
DIRECT_URL=postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/pulse?sslmode=require
AUTH_SECRET=f47a68e7d23d8c1e847cbb6509f6b92a4872951dcbe8f451a9a81e9f1a2b3c4d
AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Pulse
NODE_ENV=development
```

### 2.3 Run Migrations & Seed Data
Initialize the database schema and load the realistic seed dataset:

```bash
# 1. Apply versioned migrations
npm run db:migrate

# 2. Populate idempotent demo dataset
npm run db:seed
```

### 2.4 Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Demo Credentials

Seed accounts generated for testing all three roles:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **ADMIN** | `admin@pulse.local` | `Admin@12345` | Global oversight, bonus approvals, audit ledger, user provisioning, system settings |
| **LEAD** | `lead@pulse.local` | `Lead@12345` | Department team scope, author reviews, award bonuses, resolve team escalations |
| **USER** | `user@pulse.local` | `User@12345` | Private self-scope, review acknowledgement, raise confidential workplace complaints |

---

## 4. Key Architectural Guarantees

1. **Mandatory Reasons Everywhere:**
   - Bonuses require `reason` (min 10 non-whitespace characters).
   - Escalations require `description` (min 10 chars).
   - Reviews require `summary` (min 10 chars).
   - Rejections and status closures require explicit recorded resolutions.

2. **Atomic & Append-Only Audit Logging:**
   - Every mutation runs inside a single database transaction via `withAudit()`.
   - If audit record writing fails, the mutation rolls back atomically.
   - Audit logs are append-only (no `UPDATE` or `DELETE` permitted).

3. **Strict Server-Side RBAC Scoping:**
   - All repository and service functions take an explicit `actor: SessionUser`.
   - Probing an unauthorized entity UUID returns a clean `404` (not `403` to prevent record existence leakage).
   - Employee views never leak internal management notes or unapproved bonus drafts.

4. **Currency & Localization:**
   - Monies stored as `numeric(12,2)` and displayed with standard Indian numbering formatting (`₹1,25,000.00`).
   - Timestamps stored as UTC `timestamptz` and rendered in `Asia/Kolkata`.

5. **Soft Delete Across All Domains:**
   - Deleted users, bonuses, reviews, and escalations set `deleted_at = now()`.
   - Administrators can review and restore records from `/settings/recycle-bin` with audited traceability.

---

## 5. Verification & Testing

```bash
# Run unit & RBAC test suite
npm run test

# Run TypeScript typecheck
npx tsc --noEmit

# Run production build
npm run build
```
