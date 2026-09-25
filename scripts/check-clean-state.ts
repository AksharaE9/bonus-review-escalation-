import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import { sql } from "drizzle-orm";
import * as schema from "../src/db/schema";

dotenv.config();
neonConfig.webSocketConstructor = ws;

async function main() {
  console.log("🔍 Running Pulse Clean-State Verification Guard...");
  const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!url) {
    console.error("❌ DATABASE_URL is missing.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  try {
    const userCountRes = await db.execute(sql`SELECT COUNT(*)::int as count FROM users WHERE deleted_at IS NULL`);
    const userCount = Number(userCountRes.rows[0]?.count ?? 0);

    const bonusCountRes = await db.execute(sql`SELECT COUNT(*)::int as count FROM bonuses`);
    const bonusCount = Number(bonusCountRes.rows[0]?.count ?? 0);

    const reviewCountRes = await db.execute(sql`SELECT COUNT(*)::int as count FROM reviews`);
    const reviewCount = Number(reviewCountRes.rows[0]?.count ?? 0);

    const escalationCountRes = await db.execute(sql`SELECT COUNT(*)::int as count FROM escalations`);
    const escalationCount = Number(escalationCountRes.rows[0]?.count ?? 0);

    const commentCountRes = await db.execute(sql`SELECT COUNT(*)::int as count FROM escalation_comments`);
    const commentCount = Number(commentCountRes.rows[0]?.count ?? 0);

    const notificationCountRes = await db.execute(sql`SELECT COUNT(*)::int as count FROM notifications`);
    const notificationCount = Number(notificationCountRes.rows[0]?.count ?? 0);

    console.log("Current Database State:");
    console.log(` - Users               : ${userCount} (Target: 3)`);
    console.log(` - Bonuses             : ${bonusCount} (Target: 0)`);
    console.log(` - Reviews             : ${reviewCount} (Target: 0)`);
    console.log(` - Escalations         : ${escalationCount} (Target: 0)`);
    console.log(` - Escalation Comments : ${commentCount} (Target: 0)`);
    console.log(` - Notifications       : ${notificationCount} (Target: 0)`);

    const errors: string[] = [];
    if (userCount !== 3) errors.push(`Expected exactly 3 active users, found ${userCount}`);
    if (bonusCount !== 0) errors.push(`Expected 0 bonuses in clean state, found ${bonusCount}`);
    if (reviewCount !== 0) errors.push(`Expected 0 reviews in clean state, found ${reviewCount}`);
    if (escalationCount !== 0) errors.push(`Expected 0 escalations in clean state, found ${escalationCount}`);
    if (commentCount !== 0) errors.push(`Expected 0 comments in clean state, found ${commentCount}`);
    if (notificationCount !== 0) errors.push(`Expected 0 notifications in clean state, found ${notificationCount}`);

    if (errors.length > 0) {
      console.error("\n❌ CLEAN-STATE GUARD FAILED:");
      errors.forEach((e) => console.error(`   • ${e}`));
      process.exit(1);
    }

    console.log("\n✅ CLEAN-STATE GUARD PASSED: Exactly 3 production users, 0 business records.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Clean-state guard error:", err);
  process.exit(1);
});
