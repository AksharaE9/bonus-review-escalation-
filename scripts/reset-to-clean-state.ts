import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import * as schema from "../src/db/schema";

dotenv.config();
neonConfig.webSocketConstructor = ws;

const REQUIRED_FLAG = "YES_DELETE_ALL_BUSINESS_DATA";

async function main() {
  console.log("====================================================");
  console.log("   PULSE — CLEAN-STATE DATABASE RESET PROTOCOL      ");
  console.log("====================================================");

  // 1. Safety verification
  const confirmReset = process.env.CONFIRM_RESET;
  if (confirmReset !== REQUIRED_FLAG) {
    console.error(`❌ RESET REFUSED: Missing confirmation flag.`);
    console.error(`   You must explicitly run with CONFIRM_RESET=${REQUIRED_FLAG}`);
    process.exit(1);
  }

  const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!url || url.trim() === "") {
    console.error("❌ RESET REFUSED: DATABASE_URL environment variable is missing.");
    process.exit(1);
  }

  // Mask database URL for safety
  const maskedUrl = url.replace(/:([^:@]+)@/, ":****@");
  console.log(`🎯 Target Database: ${maskedUrl}`);

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  try {
    // 2. Pre-reset inventory
    console.log("\n📊 [STEP 1/5] CAPTURING PRE-RESET INVENTORY...");
    const preInventory = await getInventory(db);
    console.table(preInventory);

    // 3. Foreign-key-safe data deletion
    console.log("\n🧹 [STEP 2/5] PURGING DEMO & BUSINESS RECORDS (FOREIGN-KEY-SAFE ORDER)...");
    
    // Child tables first
    await db.execute(sql`TRUNCATE TABLE escalation_comments CASCADE`);
    await db.execute(sql`TRUNCATE TABLE escalations CASCADE`);
    await db.execute(sql`TRUNCATE TABLE review_ratings CASCADE`);
    await db.execute(sql`TRUNCATE TABLE reviews CASCADE`);
    await db.execute(sql`TRUNCATE TABLE bonuses CASCADE`);
    await db.execute(sql`TRUNCATE TABLE notifications CASCADE`);
    await db.execute(sql`TRUNCATE TABLE attachments CASCADE`);
    await db.execute(sql`TRUNCATE TABLE audit_logs CASCADE`);

    // Disconnect relationships before truncating users & departments
    await db.execute(sql`UPDATE users SET department_id = NULL, manager_id = NULL`);
    await db.execute(sql`UPDATE departments SET lead_user_id = NULL`);
    await db.execute(sql`TRUNCATE TABLE users CASCADE`);
    await db.execute(sql`TRUNCATE TABLE departments CASCADE`);

    // 4. Ensure Reference / Configuration Data
    console.log("\n⚙️ [STEP 3/5] ENSURING REFERENCE & CONFIGURATION DATA...");

    // App settings
    await db.execute(sql`TRUNCATE TABLE app_settings CASCADE`);
    await db.insert(schema.appSettings).values([
      {
        key: "sla_hours",
        value: { LOW: 120, MEDIUM: 72, HIGH: 24, CRITICAL: 4 },
      },
      {
        key: "bonus_requires_admin_approval",
        value: true,
      },
      {
        key: "allow_anonymous_complaints",
        value: true,
      },
      {
        key: "org_name",
        value: "Pulse Enterprise",
      },
      {
        key: "currency",
        value: "INR",
      },
      {
        key: "audit_retention_days",
        value: 365,
      },
    ]);

    // Competencies (8 standard performance competencies)
    await db.execute(sql`TRUNCATE TABLE competencies CASCADE`);
    await db.insert(schema.competencies).values([
      { name: "Ownership", description: "Takes end-to-end accountability for outcomes and initiatives.", weight: "1.25", sortOrder: 1 },
      { name: "Quality of Work", description: "Consistently produces robust, well-architected, and high-fidelity output.", weight: "1.25", sortOrder: 2 },
      { name: "Communication", description: "Articulates ideas clearly, listens actively, and documents thoroughly.", weight: "1.00", sortOrder: 3 },
      { name: "Collaboration", description: "Fosters team psychological safety, unblocks peers, and shares context.", weight: "1.00", sortOrder: 4 },
      { name: "Reliability & Attendance", description: "Dependable execution, adheres to commitments and core working windows.", weight: "0.75", sortOrder: 5 },
      { name: "Problem Solving", description: "Demonstrates deep analytical rigor and systematic troubleshooting.", weight: "1.25", sortOrder: 6 },
      { name: "Client Handling", description: "Represents the organization professionally and manages stakeholder expectations.", weight: "1.00", sortOrder: 7 },
      { name: "Learning & Growth", description: "Actively acquires new skills and mentors junior team members.", weight: "0.75", sortOrder: 8 },
    ]);

    // 5. Provision exactly THREE Production Accounts
    console.log("\n👤 [STEP 4/5] PROVISIONING EXACTLY THREE PRODUCTION ACCOUNTS...");

    // Create 1 primary department: Engineering
    const [dept] = await db.insert(schema.departments).values({
      name: "Engineering",
      code: "ENG",
      isActive: true,
    }).returning();

    const adminEmail = process.env.ADMIN_EMAIL || "admin@pulse.internal";
    const adminPassword = process.env.ADMIN_PASSWORD || "AdminSecure#2026!";
    const leadEmail = process.env.LEAD_EMAIL || "lead@pulse.internal";
    const leadPassword = process.env.LEAD_PASSWORD || "LeadSecure#2026!";
    const userEmail = process.env.USER_EMAIL || "user@pulse.internal";
    const userPassword = process.env.USER_PASSWORD || "UserSecure#2026!";

    const adminHash = await bcrypt.hash(adminPassword, 12);
    const leadHash = await bcrypt.hash(leadPassword, 12);
    const userHash = await bcrypt.hash(userPassword, 12);

    // 1. Admin
    const [adminUser] = await db.insert(schema.users).values({
      employeeCode: "PULSE-001",
      email: adminEmail.toLowerCase().trim(),
      passwordHash: adminHash,
      fullName: "System Administrator",
      role: "ADMIN",
      departmentId: dept.id,
      designation: "Head of People Operations & Security",
      status: "ACTIVE",
      mustChangePassword: true,
      sessionVersion: 1,
    }).returning();

    // 2. Lead
    const [leadUser] = await db.insert(schema.users).values({
      employeeCode: "PULSE-002",
      email: leadEmail.toLowerCase().trim(),
      passwordHash: leadHash,
      fullName: "Engineering Lead",
      role: "LEAD",
      departmentId: dept.id,
      designation: "Principal Engineering Lead",
      status: "ACTIVE",
      mustChangePassword: true,
      sessionVersion: 1,
    }).returning();

    // Assign lead to Engineering Department
    await db.execute(sql`UPDATE departments SET lead_user_id = ${leadUser.id} WHERE id = ${dept.id}`);

    // 3. User (Direct report to Lead)
    const [standardUser] = await db.insert(schema.users).values({
      employeeCode: "PULSE-003",
      email: userEmail.toLowerCase().trim(),
      passwordHash: userHash,
      fullName: "Senior Software Engineer",
      role: "USER",
      departmentId: dept.id,
      managerId: leadUser.id,
      designation: "Senior Software Engineer",
      status: "ACTIVE",
      mustChangePassword: true,
      sessionVersion: 1,
    }).returning();

    // Audit entries for the 3 provisioned accounts
    await db.insert(schema.auditLogs).values([
      {
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        actorRole: "ADMIN",
        action: "CREATE",
        entityType: "USER",
        entityId: adminUser.id,
        entityLabel: adminUser.fullName,
        ipAddress: "127.0.0.1",
        userAgent: "Pulse Clean-State Provisioner",
        after: { email: adminUser.email, role: "ADMIN", reason: "Clean-state provisioning" },
      },
      {
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        actorRole: "ADMIN",
        action: "CREATE",
        entityType: "USER",
        entityId: leadUser.id,
        entityLabel: leadUser.fullName,
        ipAddress: "127.0.0.1",
        userAgent: "Pulse Clean-State Provisioner",
        after: { email: leadUser.email, role: "LEAD", department: dept.name },
      },
      {
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        actorRole: "ADMIN",
        action: "CREATE",
        entityType: "USER",
        entityId: standardUser.id,
        entityLabel: standardUser.fullName,
        ipAddress: "127.0.0.1",
        userAgent: "Pulse Clean-State Provisioner",
        after: { email: standardUser.email, role: "USER", managerId: leadUser.id },
      },
    ]);

    // 6. Post-reset inventory
    console.log("\n📊 [STEP 5/5] POST-RESET INVENTORY PROOF...");
    const postInventory = await getInventory(db);
    console.table(postInventory);

    console.log("\n✅ CLEAN-STATE RESET COMPLETED SUCCESSFULLY!");
    console.log("   • Production Accounts : 3 (ADMIN, LEAD, USER)");
    console.log("   • Business Records    : 0 (Bonuses, Reviews, Escalations, Comments, Notifications)");
    console.log("   • Reference Config    : 8 Competencies, 6 App Settings, 1 Active Department");
  } finally {
    await pool.end();
  }
}

async function getInventory(db: any) {
  const tables = [
    "users",
    "departments",
    "bonuses",
    "reviews",
    "review_ratings",
    "competencies",
    "escalations",
    "escalation_comments",
    "notifications",
    "attachments",
    "audit_logs",
    "app_settings",
  ];

  const results: Record<string, number> = {};
  for (const table of tables) {
    const res = await db.execute(sql.raw(`SELECT COUNT(*)::int as count FROM "${table}"`));
    results[table] = res.rows[0]?.count ?? 0;
  }
  return results;
}

main().catch((err) => {
  console.error("❌ Clean-state reset failed:", err);
  process.exit(1);
});
