import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "healthy";

  try {
    // Quick probe query
    await db.execute(sql`SELECT 1`);
  } catch {
    dbStatus = "unreachable";
  }

  const responseTimeMs = Date.now() - startTime;
  const isHealthy = dbStatus === "healthy";

  return NextResponse.json(
    {
      status: isHealthy ? "pass" : "warn",
      version: process.env.npm_package_version || "1.0.0",
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
      checks: {
        database: {
          status: dbStatus,
          responseTimeMs,
        },
      },
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
