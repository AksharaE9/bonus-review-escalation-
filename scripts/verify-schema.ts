import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import { sql } from "drizzle-orm";

dotenv.config();
neonConfig.webSocketConstructor = ws;

async function verifySchema() {
  const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!url || url.trim() === "") {
    console.log("ℹ️ Verify schema skipped: DATABASE_URL is not configured.");
    return;
  }

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);

  try {
    console.log("=========================================================");
    console.log("🔍 PULSE SCHEMA VERIFICATION & HEALTH REPORT");
    console.log("=========================================================");

    const tables = [
      "departments",
      "users",
      "bonuses",
      "competencies",
      "review_cycles",
      "reviews",
      "review_ratings",
      "escalations",
      "escalation_comments",
      "attachments",
      "audit_logs",
      "notifications",
      "app_settings",
    ];

    console.log("\n📊 TABLE ROW COUNTS:");
    for (const table of tables) {
      try {
        const countRes = await db.execute(
          sql.raw(`SELECT count(*)::int as count FROM "${table}"`)
        );
        const count = countRes.rows[0]?.count ?? 0;
        console.log(`   • ${table.padEnd(22)} : ${count} rows`);
      } catch (err: unknown) {
        console.log(`   • ${table.padEnd(22)} : [Table missing or error: ${(err as Error).message}]`);
      }
    }

    console.log("\n⚡ INDEXES VERIFICATION:");
    const indexQuery = await db.execute(sql`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `);

    for (const row of indexQuery.rows) {
      console.log(`   [${row.tablename}] ${row.indexname}`);
    }

    console.log("\n=========================================================");
    console.log("✅ Schema verification complete.");
    console.log("=========================================================");
  } catch (error) {
    console.error("❌ Verify schema error:", error);
  } finally {
    await pool.end();
  }
}

verifySchema();
