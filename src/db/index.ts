import "server-only";
import { neon, Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleServerless } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

if (typeof globalThis.WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url || url.trim() === "") {
    throw new Error(
      "CRITICAL: DATABASE_URL environment variable is missing or empty. " +
        "Pulse requires a valid Neon serverless pooled connection string. " +
        "Set DATABASE_URL in your .env file or deployment environment."
    );
  }
  return url;
}

// Module-level singletons for warm connection reuse across serverless invocations

/**
 * Single-statement read client using Neon HTTP driver.
 * Use `db` for fast, connectionless queries (e.g. read-only selects, lookups).
 */
export const db = (() => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Lazily proxy to avoid failing at compile/build time when DATABASE_URL is not yet set
    return new Proxy({} as ReturnType<typeof drizzleHttp<typeof schema>>, {
      get(_target, prop) {
        const url = getDatabaseUrl();
        const sql = neon(url);
        const client = drizzleHttp(sql, { schema });
        return Reflect.get(client, prop);
      },
    });
  }
  const sql = neon(connectionString);
  return drizzleHttp(sql, { schema });
})();

/**
 * Multi-statement and transactional client using Neon WebSocket Pool.
 * Use `txDb` for all mutations and transactions where multi-statement atomicity is required.
 */
export const txDb = (() => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return new Proxy({} as ReturnType<typeof drizzleServerless<typeof schema>>, {
      get(_target, prop) {
        const url = getDatabaseUrl();
        const pool = new Pool({ connectionString: url });
        const client = drizzleServerless(pool, { schema });
        return Reflect.get(client, prop);
      },
    });
  }
  const pool = new Pool({ connectionString });
  return drizzleServerless(pool, { schema });
})();

export type Database = typeof db;
export type TransactionalDatabase = typeof txDb;
