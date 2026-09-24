import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import type { Role } from "@/types";

dotenv.config();
neonConfig.webSocketConstructor = ws;

async function seed() {
  const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!url || url.trim() === "") {
    console.error("❌ Seed failed: DATABASE_URL is not set.");
    process.exit(1);
  }

  console.log("🌱 Initializing Pulse Seed Engine (Clean State)...");
  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  try {
    // 1. Clear existing data in reverse topological order for complete idempotency
    console.log("🧹 Clearing previous test data...");
    await db.execute(sql`TRUNCATE TABLE audit_logs CASCADE`);
    await db.execute(sql`TRUNCATE TABLE attachments CASCADE`);
    await db.execute(sql`TRUNCATE TABLE escalation_comments CASCADE`);
    await db.execute(sql`TRUNCATE TABLE escalations CASCADE`);
    await db.execute(sql`TRUNCATE TABLE review_ratings CASCADE`);
    await db.execute(sql`TRUNCATE TABLE reviews CASCADE`);
    await db.execute(sql`TRUNCATE TABLE review_cycles CASCADE`);
    await db.execute(sql`TRUNCATE TABLE competencies CASCADE`);
    await db.execute(sql`TRUNCATE TABLE bonuses CASCADE`);
    await db.execute(sql`TRUNCATE TABLE notifications CASCADE`);
    await db.execute(sql`TRUNCATE TABLE app_settings CASCADE`);
    await db.execute(sql`UPDATE users SET department_id = NULL, manager_id = NULL`);
    await db.execute(sql`TRUNCATE TABLE departments CASCADE`);
    await db.execute(sql`TRUNCATE TABLE users CASCADE`);

    // 2. Insert App Settings
    console.log("⚙️ Seeding App Settings...");
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
        value: "Pulse Enterprises Ltd",
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

    // 3. Insert Competencies
    console.log("🎯 Seeding Competencies...");
    const competencyData = [
      { name: "Ownership", description: "Takes end-to-end accountability for outcomes and initiatives.", weight: "1.25", sortOrder: 1 },
      { name: "Quality of Work", description: "Consistently produces robust, well-architected, and high-fidelity output.", weight: "1.25", sortOrder: 2 },
      { name: "Communication", description: "Articulates ideas clearly, listens actively, and documents thoroughly.", weight: "1.00", sortOrder: 3 },
      { name: "Collaboration", description: "Fosters team psychological safety, unblocks peers, and shares context.", weight: "1.00", sortOrder: 4 },
      { name: "Reliability & Attendance", description: "Dependable execution, adheres to commitments and core working windows.", weight: "0.75", sortOrder: 5 },
      { name: "Problem Solving", description: "Demonstrates deep analytical rigor and systematic troubleshooting.", weight: "1.25", sortOrder: 6 },
      { name: "Client Handling", description: "Represents the organization professionally and manages stakeholder expectations.", weight: "1.00", sortOrder: 7 },
      { name: "Learning & Growth", description: "Actively acquires new skills and mentors junior team members.", weight: "0.75", sortOrder: 8 },
    ];
    await db.insert(schema.competencies).values(competencyData);

    // 4. Insert Departments
    console.log("🏢 Seeding Departments...");
    const departmentData = [
      { name: "Engineering", code: "ENG" },
      { name: "Product & Design", code: "PRD" },
      { name: "Operations & Support", code: "OPS" },
    ];
    const insertedDepts = await db.insert(schema.departments).values(departmentData).returning();
    const deptMap = new Map(insertedDepts.map((d) => [d.code, d.id]));

    // 5. Hash standard passwords
    console.log("🔒 Generating password hashes...");
    const adminHash = await bcrypt.hash("Admin@12345", 10);
    const leadHash = await bcrypt.hash("Lead@12345", 10);

    // 6. Insert Users: 1 Admin and 1 Lead
    console.log("👥 Seeding 1 Admin and 1 Lead user...");
    const usersToInsert = [
      // 1 Admin
      {
        employeeCode: "EMP001",
        email: "admin@pulse.local",
        passwordHash: adminHash,
        fullName: "Priya Sharma",
        role: "ADMIN" as const,
        departmentId: deptMap.get("ENG")!,
        designation: "VP of People Operations",
        dateOfJoining: "2021-04-01",
        phone: "+91 98765 43210",
        status: "ACTIVE" as const,
        mustChangePassword: false,
      },
      // 1 Lead
      {
        employeeCode: "EMP002",
        email: "lead@pulse.local",
        passwordHash: leadHash,
        fullName: "Rajesh Menon",
        role: "LEAD" as const,
        departmentId: deptMap.get("ENG")!,
        designation: "Director of Engineering",
        dateOfJoining: "2021-06-15",
        phone: "+91 98765 43211",
        status: "ACTIVE" as const,
        mustChangePassword: false,
      },
    ];

    const insertedUsers = await db.insert(schema.users).values(usersToInsert).returning();
    const adminUser = insertedUsers[0];
    const leadUser = insertedUsers[1];

    // 7. Seed Review Cycle
    console.log("📅 Seeding Review Cycle...");
    await db.insert(schema.reviewCycles).values([
      {
        name: "FY 2025 Annual Review Cycle",
        reviewType: "ANNUAL",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        isOpen: true,
      },
    ]);

    // 8. Seed Audit Log for initial configuration
    console.log("📜 Seeding Initial Audit Log...");
    await db.insert(schema.auditLogs).values([
      {
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        actorRole: "ADMIN" as Role,
        action: "CREATE" as const,
        entityType: "system",
        entityId: "system_init",
        entityLabel: "System Provisioned & Initialized",
        before: null,
        after: {
          admin: adminUser.email,
          lead: leadUser.email,
          orgName: "Pulse Enterprises Ltd",
        },
        changedFields: ["system_init"],
        ipAddress: "127.0.0.1",
        userAgent: "PulseProvisioningEngine/1.0",
        createdAt: new Date(),
      },
    ]);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ PULSE DATABASE CLEAN SEED COMPLETED!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔑 PRESERVED LOGIN CREDENTIALS:");
    console.log("   ADMIN : admin@pulse.local / Admin@12345");
    console.log("   LEAD  : lead@pulse.local  / Lead@12345");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
