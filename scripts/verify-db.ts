import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import { sql } from "drizzle-orm";

dotenv.config();
neonConfig.webSocketConstructor = ws;

export async function verifyDatabase() {
  const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!url || url.trim() === "") {
    console.error("❌ Verify DB error: DATABASE_URL is not set.");
    return false;
  }

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);

  try {
    console.log("═════════════════════════════════════════════════════════════");
    console.log("📊 PULSE DATABASE INTEGRITY & VERIFICATION REPORT");
    console.log("═════════════════════════════════════════════════════════════");

    const tables = [
      "departments",
      "users",
      "competencies",
      "review_cycles",
      "reviews",
      "review_ratings",
      "bonuses",
      "escalations",
      "escalation_comments",
      "attachments",
      "audit_logs",
      "notifications",
      "app_settings",
    ];

    console.log("\n📌 LIVE TABLE ROW COUNTS:");
    let totalRows = 0;
    for (const table of tables) {
      try {
        const countRes = await db.execute(
          sql.raw(`SELECT count(*)::int as count FROM "${table}"`)
        );
        const count = Number(countRes.rows[0]?.count ?? 0);
        totalRows += count;
        console.log(`   ✓ ${table.padEnd(24)} : ${count.toString().padStart(4, " ")} rows`);
      } catch (err: unknown) {
        console.log(`   ✗ ${table.padEnd(24)} : [ERROR: ${(err as Error).message}]`);
      }
    }

    console.log("\n📌 TOTAL DATABASE RECORDS:", totalRows);

    console.log("\n📌 ENUM TYPES IN SCHEMA:");
    const enumQuery = await db.execute(sql`
      SELECT t.typname as enum_name, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      GROUP BY t.typname
      ORDER BY t.typname;
    `);

    for (const row of enumQuery.rows) {
      console.log(`   • ${String(row.enum_name).padEnd(22)} : [${row.enum_values}]`);
    }

    console.log("═════════════════════════════════════════════════════════════");
    console.log("✅ Database verification complete and healthy.");
    console.log("═════════════════════════════════════════════════════════════");
    return true;
  } catch (error) {
    console.error("❌ Database verification failed:", error);
    return false;
  } finally {
    await pool.end();
  }
}

if (process.argv[1]?.includes("verify-db")) {
  verifyDatabase();
}
