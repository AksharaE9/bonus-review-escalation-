# Pulse — Employee Bonus, Review & Escalation Management System

> **Pulse** is an enterprise people-operations console where management records and employees track **Bonuses**, **Performance Reviews**, and **Escalations** — backed by an append-only, tamper-evident audit trail.

---

## 1. Tech Stack

- **Framework:** Next.js 15 (App Router, Server Components & Server Actions, React 19)
- **Styling:** Tailwind CSS v4, custom design tokens in `globals.css` (Inter font, tabular numerals, hairline borders)
- **Component Primitives:** shadcn/ui (Radix UI)
- **Icons:** `lucide-react`
- **Charts:** `recharts` (bonus spend bar chart & escalation resolution velocity)
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
Copy `.env.example` to `.env` and fill in your own values:

```bash
cp .env.example .env
```

Edit `.env` and provide your database connection strings, a randomly generated `AUTH_SECRET`, and the `AUTH_URL` for your deployment origin. Refer to `.env.example` for all required variable names. **Never commit `.env` or any file containing real credentials.**

Generate `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 2.3 Run Migrations & Bootstrap

```bash
# 1. Apply versioned schema migrations
npm run db:migrate

# 2. Bootstrap initial admin account (uses BOOTSTRAP_ADMIN_EMAIL + BOOTSTRAP_ADMIN_PASSWORD env vars)
# OR run the seed for a development dataset (refuses to run in production without ALLOW_DEMO_SEED=true)
npm run db:seed
```

### 2.4 Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Account Provisioning

Accounts are **admin-created only** — there is no public self-registration. The initial admin account is bootstrapped via `scripts/bootstrap-admin.ts` using environment variables, or via the seed script in development.

Once an admin is created, all subsequent accounts (team leads, employees) are provisioned through the Admin → Settings → Users panel.

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

# Run linter
npm run lint

# Run production build (verify CSS and JS emit)
npm run build
```
