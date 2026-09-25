import { AsyncLocalStorage } from "node:async_hooks";

export interface QueryRecord {
  sql: string;
  durationMs: number;
  timestamp: number;
}

export interface RequestMetrics {
  requestId: string;
  route: string;
  startTime: number;
  queries: QueryRecord[];
  renderDurationMs?: number;
}

const storage = new AsyncLocalStorage<RequestMetrics>();

/**
 * Initializes or runs a function within an isolated request context for telemetry and profiling.
 */
export function runWithRequestContext<T>(
  initial: Partial<RequestMetrics>,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const metrics: RequestMetrics = {
    requestId: initial.requestId || crypto.randomUUID(),
    route: initial.route || "unknown",
    startTime: initial.startTime || performance.now(),
    queries: initial.queries || [],
    renderDurationMs: initial.renderDurationMs,
  };
  return storage.run(metrics, fn);
}

/**
 * Gets the current request context metrics, if inside an instrumented context.
 */
export function getRequestMetrics(): RequestMetrics | undefined {
  return storage.getStore();
}

/**
 * Records a database query execution time and increments per-request counters.
 */
export function recordDbQuery(sql: string, durationMs: number): void {
  const ctx = storage.getStore();
  if (ctx) {
    ctx.queries.push({
      sql: sql.replace(/\s+/g, " ").trim(),
      durationMs,
      timestamp: Date.now(),
    });
  }
}

/**
 * Emits the standardized query summary log:
 * [request-id] N queries in Xms (route)
 */
export function logRequestMetrics(ctx?: RequestMetrics): void {
  const target = ctx || storage.getStore();
  if (!target) return;

  const totalTime = target.queries.reduce((acc, q) => acc + q.durationMs, 0);
  const totalRender = performance.now() - target.startTime;
  target.renderDurationMs = totalRender;

  console.log(
    `[${target.requestId}] ${target.queries.length} queries in ${totalTime.toFixed(1)}ms (SSR: ${totalRender.toFixed(1)}ms) [${target.route}]`
  );
}
