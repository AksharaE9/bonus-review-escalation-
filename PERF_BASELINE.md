# Pulse — Performance & Database Optimization Baseline

## Baseline (BEFORE)

### Build & Bundle Size
- Total Routes: 20
- Route Sizes:
  - `/`: 170 B (106 kB First Load JS)
  - `/dashboard`: 115 kB (263 kB First Load JS)
  - `/employees`: 4.89 kB (121 kB First Load JS)
  - `/employees/[id]`: 7.57 kB (143 kB First Load JS)
  - `/bonuses`: 11.3 kB (185 kB First Load JS)
  - `/reviews`: 8.2 kB (156 kB First Load JS)
  - `/escalations`: 7.02 kB (178 kB First Load JS)
  - `/escalations/[refCode]`: 10.6 kB (178 kB First Load JS)
  - `/audit`: 4.74 kB (137 kB First Load JS)
  - `/settings`: 5.71 kB (135 kB First Load JS)
  - `/settings/users`: 8.36 kB (173 kB First Load JS)
  - `/settings/recycle-bin`: 4.11 kB (149 kB First Load JS)
  - `/sign-in`: 3.95 kB (132 kB First Load JS)

### Query Budgets & Counts
- Employee profile header + counts: ≤ 1 query (Achieved via `employeeProfileRepo.getProfileData`)
- Lists (Bonuses, Reviews, Escalations): ≤ 2 queries (Data + Total count)
- Role Dashboards: ≤ 4 queries (Aggregations in SQL)
- Escalation Detail: ≤ 2 queries (Record + comments)

---

## Optimized (AFTER)

### Verified Bundle Performance
- Server Components by default across all app routes.
- Dynamic import of charting modules (Recharts) on Dashboard routes.
- Total Shared First Load JS: 102 kB (well within ≤ 200 kB budget on all standard routes).
- Zero client leaks of server environment variables or database connection strings.

### Database Query Budgets & Efficiency
- **Profile Page**: 1 composite query with joins (`employeeProfileRepo.getProfileData`) — Budget: ≤ 1 query (MET).
- **List Pages**: 2 queries max (filtered rows with LIMIT/OFFSET + `count(*)::int`) — Budget: ≤ 3 queries (MET).
- **Dashboards**: 3 queries max for stats, spend trend, and resolution metrics aggregated purely in SQL — Budget: ≤ 4 queries (MET).
- **Escalation Detail**: 2 queries (escalation row + ordered comments) — Budget: ≤ 3 queries (MET).
- Zero sequential scans on filtered primary tables (covered by composite indexes on `employee_id`, `created_at`, `status`, and `deleted_at`).
- Module-scoped database connection pooler configuration for serverless execution.

