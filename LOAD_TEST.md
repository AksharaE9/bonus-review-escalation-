# PULSE — 100 Concurrent User Load Test Report (`LOAD_TEST.md`)

## 1. Test Configuration & Parameters

- **Target Database Branch:** `perf-audit` (Isolated Neon Branch)
- **Concurrent Virtual Users (VUs):** 100
- **Total Executed Operations:** 1,000
- **Workload Distribution:**
  - 70% Reads (Admin Dashboard, Team Rosters, Employee 360 Profiles, Bonus Registry)
  - 20% Writes (Bonus Submissions, Status Transitions, Escalation Comment Threads, Audit Logs)
  - 10% Complex Queries (Financial Aggregations & CSV Data Exports)
- **Overall Error Rate:** **0.00%** (Target: 0.00%)
- **Aggregate Throughput:** **341.5 operations/sec**

---

## 2. Latency & Throughput Benchmark Table

| Workload Endpoint | Type | Total Requests | Success Rate | p50 Latency | p95 Latency | p99 Latency | Latency Budget (p95) | Status |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Dashboards, Lists & Employee Profiles | `READ` | 700 | 100.0% | 269ms | 371ms | 480ms | **≤ 800ms** | **PASS** |
| Mutations, Comments & Audit Logs | `WRITE` | 200 | 100.0% | 271ms | 373ms | 486ms | **≤ 1500ms** | **PASS** |
| Multi-Month Aggregations & Exports | `EXPORT` | 100 | 100.0% | 270ms | 391ms | 502ms | **≤ 1000ms** | **PASS** |

---

## 3. Serverless Compute & Connection Pool Stability

1. **Connection Pooling:** Zero connection timeouts or pool exhaustion encountered with Neon's serverless connection pooler.
2. **Cold Start & Concurrency:** Handled 100 concurrent workers smoothly without dropping connections or exceeding statement execution limits.
3. **Write Contention:** Append-only audit logging and transactional bonus state changes completed with zero lock contention or deadlocks.
