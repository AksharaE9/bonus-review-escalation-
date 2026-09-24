import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import ws from "ws";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config();
neonConfig.webSocketConstructor = ws;

async function runMigrations() {
  const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!directUrl || directUrl.trim() === "") {
    console.error(
      "❌ Migration failed: DIRECT_URL or DATABASE_URL environment variable is missing."
    );
    process.exit(1);
  }

  console.log("🔄 Connecting to database for migrations...");
  const pool = new Pool({ connectionString: directUrl });
  const db = drizzle(pool);

  try {
    console.log("🚀 Applying migrations from ./src/db/migrations...");
    const migrationsFolder = path.resolve(process.cwd(), "src/db/migrations");
    await migrate(db, { migrationsFolder });
    console.log("✅ Migrations applied successfully!");
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
