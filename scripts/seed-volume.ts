import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { randomUUID } from "crypto";

dotenv.config();
neonConfig.webSocketConstructor = ws;

// Production Guard
if (process.env.NODE_ENV === "production" && process.env.ALLOW_VOLUME_FIXTURE !== "true") {
  console.error("❌ VOLUME FIXTURE REFUSED: Cannot run volume fixture against production without ALLOW_VOLUME_FIXTURE=true.");
  process.exit(1);
}

const FIRST_NAMES = [
  "Aarav", "Aditi", "Rohan", "Ananya", "Vikram", "Priya", "Rahul", "Sneha", "Karthik", "Pooja",
  "Arjun", "Neha", "Siddharth", "Meera", "Varun", "Riya", "Aditya", "Divya", "Gaurav", "Tanvi",
  "Nikhil", "Ishita", "Pranav", "Shruti", "Akash", "Kavya", "Deepak", "Swati", "Manish", "Shreya"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Reddy", "Nair", "Iyer", "Rao", "Gupta", "Malhotra", "Kapoor",
  "Chopra", "Joshi", "Kulkarni", "Deshmukh", "Menon", "Pillai", "Bose", "Chatterjee", "Banerjee", "Dutta"
];

const DEPARTMENTS = [
  { name: "Core Infrastructure", code: "INFRA" },
  { name: "Frontend Platform", code: "FRONT" },
  { name: "Backend Services", code: "BACK" },
  { name: "Data Engineering", code: "DATA" },
  { name: "Security & Compliance", code: "SEC" },
  { name: "Product Design", code: "DESIGN" },
  { name: "Product Management", code: "PROD" },
  { name: "Quality Assurance", code: "QA" },
  { name: "DevOps & SRE", code: "SRE" },
  { name: "People Operations", code: "HR" },
  { name: "Finance & Operations", code: "FIN" },
  { name: "Customer Experience", code: "CX" }
];

const BONUS_TYPES = ["PERFORMANCE", "SPOT", "REFERRAL", "FESTIVE", "RETENTION", "PROJECT", "MILESTONE", "OTHER"];
const BONUS_STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "PAID", "CANCELLED"];
const ESC_CATEGORIES = ["PERFORMANCE", "ATTENDANCE", "BEHAVIOUR", "POLICY_VIOLATION", "CLIENT_COMPLAINT", "PAYROLL", "WORKPLACE", "IT_ASSET", "INTERPERSONAL", "OTHER"];
const ESC_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const ESC_STATUSES = ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "AWAITING_EMPLOYEE", "RESOLVED", "CLOSED", "WITHDRAWN"];
const AUDIT_ACTIONS = ["CREATE", "UPDATE", "STATUS_CHANGE", "SOFT_DELETE", "RESTORE", "ROLE_CHANGE", "LOGIN", "EXPORT", "PASSWORD_RESET"];

async function main() {
  console.log("====================================================");
  console.log("   PULSE — REALISTIC HIGH-VOLUME PERFORMANCE FIXTURE ");
  console.log("====================================================");

  const url = process.env.PERF_DATABASE_URL || process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!url) {
    console.error("❌ DATABASE_URL missing.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  const startTime = Date.now();

  try {
    console.log("\n🧹 Purging existing volume test data...");
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

    // 1. Settings & Competencies
    console.log("⚙️ Inserting Configuration...");
    await db.insert(schema.appSettings).values([
      { key: "sla_hours", value: { LOW: 120, MEDIUM: 72, HIGH: 24, CRITICAL: 4 } },
      { key: "bonus_requires_admin_approval", value: true },
      { key: "allow_anonymous_complaints", value: true },
      { key: "org_name", value: "Pulse Performance Test Org" },
      { key: "currency", value: "INR" },
      { key: "audit_retention_days", value: 365 },
    ]);

    const compIds: string[] = [];
    const compWeights = ["1.25", "1.25", "1.00", "1.00", "0.75", "1.25", "1.00", "0.75"];
    const compNames = ["Ownership", "Quality of Work", "Communication", "Collaboration", "Reliability", "Problem Solving", "Client Handling", "Learning"];
    for (let i = 0; i < 8; i++) {
      const id = randomUUID();
      compIds.push(id);
      await db.execute(sql.raw(`
        INSERT INTO competencies (id, name, description, weight, is_active, sort_order)
        VALUES ('${id}', '${compNames[i]}', 'Evaluation metric for ${compNames[i]}', ${compWeights[i]}, true, ${i + 1})
      `));
    }

    // 2. Departments (12)
    console.log("🏢 Seeding 12 Departments...");
    const deptIds: string[] = [];
    for (const d of DEPARTMENTS) {
      const id = randomUUID();
      deptIds.push(id);
      await db.execute(sql.raw(`
        INSERT INTO departments (id, name, code, is_active)
        VALUES ('${id}', '${d.name}', '${d.code}', true)
      `));
    }

    // 3. Users (500 users: 1 Admin, 12 Leads, 487 Engineers)
    console.log("👥 Generating 500 Users with Manager Hierarchy...");
    const userIds: string[] = [];
    const leadUserIds: string[] = [];
    const commonHash = await bcrypt.hash("PulsePass#2026!", 10);

    // Admin user
    const adminId = randomUUID();
    userIds.push(adminId);
    await db.execute(sql.raw(`
      INSERT INTO users (id, employee_code, email, password_hash, full_name, role, department_id, designation, status, must_change_password)
      VALUES ('${adminId}', 'EMP-0001', 'admin@pulse.internal', '${commonHash}', 'System Admin', 'ADMIN', '${deptIds[0]}', 'Head of People Ops', 'ACTIVE', false)
    `));

    // 12 Leads (1 per department)
    for (let i = 0; i < 12; i++) {
      const leadId = randomUUID();
      userIds.push(leadId);
      leadUserIds.push(leadId);
      const code = `EMP-${String(i + 2).padStart(4, "0")}`;
      const name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`;
      const email = `lead.${DEPARTMENTS[i].code.toLowerCase()}@pulse.internal`;
      await db.execute(sql.raw(`
        INSERT INTO users (id, employee_code, email, password_hash, full_name, role, department_id, designation, status, must_change_password)
        VALUES ('${leadId}', '${code}', '${email}', '${commonHash}', '${name}', 'LEAD', '${deptIds[i]}', 'Engineering Lead', 'ACTIVE', false)
      `));
      await db.execute(sql.raw(`UPDATE departments SET lead_user_id = '${leadId}' WHERE id = '${deptIds[i]}'`));
    }

    // 487 Users
    const userInsertChunks: string[] = [];
    for (let i = 13; i <= 500; i++) {
      const uId = randomUUID();
      userIds.push(uId);
      const deptIdx = i % 12;
      const deptId = deptIds[deptIdx];
      const leadId = leadUserIds[deptIdx];
      const code = `EMP-${String(i).padStart(4, "0")}`;
      const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(i + deptIdx) % LAST_NAMES.length];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@pulse.internal`;
      const designation = ["Software Engineer", "Senior Software Engineer", "Staff Engineer", "QA Engineer", "Product Designer", "Data Analyst"][i % 6];
      userInsertChunks.push(`('${uId}', '${code}', '${email}', '${commonHash}', '${firstName} ${lastName}', 'USER', '${deptId}', '${leadId}', '${designation}', 'ACTIVE', false)`);
    }

    // Batch insert users in chunks of 100
    for (let i = 0; i < userInsertChunks.length; i += 100) {
      const chunk = userInsertChunks.slice(i, i + 100);
      await db.execute(sql.raw(`
        INSERT INTO users (id, employee_code, email, password_hash, full_name, role, department_id, manager_id, designation, status, must_change_password)
        VALUES ${chunk.join(",")}
      `));
    }
    console.log("   ✓ 500 Users provisioned.");

    // 4. Bonuses (50,000 rows across 24 months)
    console.log("💰 Seeding 50,000 Bonuses across 24 months (batched)...");
    const bonusBatchSize = 2500;
    const totalBonuses = 50000;
    for (let bStart = 0; bStart < totalBonuses; bStart += bonusBatchSize) {
      const rows: string[] = [];
      const count = Math.min(bonusBatchSize, totalBonuses - bStart);
      for (let j = 0; j < count; j++) {
        const idx = bStart + j;
        const bId = randomUUID();
        const empId = userIds[idx % userIds.length];
        const awardedById = leadUserIds[idx % leadUserIds.length];
        const approvedById = adminId;
        const amount = (10000 + (idx * 37) % 190000).toFixed(2);
        const bType = BONUS_TYPES[idx % BONUS_TYPES.length];
        const status = BONUS_STATUSES[idx % BONUS_STATUSES.length];
        const monthOffset = idx % 24;
        const periodMonth = `202${4 + Math.floor(monthOffset / 12)}-${String((monthOffset % 12) + 1).padStart(2, "0")}-01`;
        const reason = `Exemplary performance on project milestone ${(idx % 50) + 1} and architecture refactoring deliverables.`;
        const rejReason = status === "REJECTED" ? "Insufficient justification against sprint delivery SLA." : "NULL";
        const approvedAtVal = ["APPROVED", "PAID"].includes(status) ? `'2025-01-15 10:00:00+00'` : "NULL";
        const payoutVal = status === "PAID" ? `'2025-01-28'` : "NULL";
        const rejVal = rejReason === "NULL" ? "NULL" : `'${rejReason}'`;

        rows.push(`('${bId}', '${empId}', ${amount}, 'INR', '${bType}', '${reason}', '${periodMonth}', '${status}', '${awardedById}', ${status === 'DRAFT' || status === 'PENDING_APPROVAL' ? 'NULL' : `'${approvedById}'`}, ${approvedAtVal}, ${rejVal}, ${payoutVal})`);
      }
      await db.execute(sql.raw(`
        INSERT INTO bonuses (id, employee_id, amount, currency, bonus_type, reason, period_month, status, awarded_by, approved_by, approved_at, rejection_reason, payout_date)
        VALUES ${rows.join(",")}
      `));
      process.stdout.write(`\r   → Inserted ${bStart + count} / 50,000 bonuses`);
    }
    console.log("\n   ✓ 50,000 Bonuses seeded.");

    // 5. Review Cycles & Reviews (20,000 Reviews + 160,000 Ratings)
    console.log("📋 Seeding 20,000 Performance Reviews & 160,000 Ratings (batched)...");
    const cycleId = randomUUID();
    await db.execute(sql.raw(`
      INSERT INTO review_cycles (id, name, review_type, start_date, end_date, is_open)
      VALUES ('${cycleId}', 'H2 Annual Appraisal Cycle', 'ANNUAL', '2025-07-01', '2025-12-31', true)
    `));

    const totalReviews = 20000;
    const reviewBatchSize = 2500;
    for (let rStart = 0; rStart < totalReviews; rStart += reviewBatchSize) {
      const reviewRows: string[] = [];
      const ratingRows: string[] = [];
      const count = Math.min(reviewBatchSize, totalReviews - rStart);

      for (let j = 0; j < count; j++) {
        const idx = rStart + j;
        const rId = randomUUID();
        const empId = userIds[idx % userIds.length];
        const reviewerId = leadUserIds[idx % leadUserIds.length];
        const status = ["SUBMITTED", "ACKNOWLEDGED", "CLOSED", "DRAFT"][idx % 4];
        const rating = (3.0 + (idx % 21) * 0.1).toFixed(1);
        const ackAt = status === "ACKNOWLEDGED" || status === "CLOSED" ? `'2025-08-15 14:30:00+00'` : "NULL";

        reviewRows.push(`('${rId}', '${empId}', '${reviewerId}', '${cycleId}', 'ANNUAL', '2025-07-01', '2025-12-31', ${rating}, 'Performance summary for appraisal cycle.', 'Exceptional problem solving', 'Proactive communication', '${status}', 'SHARED', ${ackAt})`);

        // 8 Ratings per review
        for (let k = 0; k < 8; k++) {
          const ratId = randomUUID();
          const score = (3 + ((idx + k) % 3));
          ratingRows.push(`('${ratId}', '${rId}', '${compIds[k]}', ${score}, 'Demonstrated consistent proficiency in core delivery.')`);
        }
      }

      await db.execute(sql.raw(`
        INSERT INTO reviews (id, employee_id, reviewer_id, cycle_id, review_type, period_start, period_end, overall_rating, summary, strengths, improvements, status, visibility, acknowledged_at)
        VALUES ${reviewRows.join(",")}
      `));

      await db.execute(sql.raw(`
        INSERT INTO review_ratings (id, review_id, competency_id, rating, comments)
        VALUES ${ratingRows.join(",")}
      `));

      process.stdout.write(`\r   → Inserted ${rStart + count} / 20,000 reviews (${(rStart + count) * 8} ratings)`);
    }
    console.log("\n   ✓ 20,000 Reviews and 160,000 Ratings seeded.");

    // 6. Escalations (30,000) & Comments (100,000)
    console.log("🚨 Seeding 30,000 Escalations & 100,000 Comments (batched)...");
    const totalEsc = 30000;
    const escBatchSize = 2500;
    const escIds: string[] = [];

    for (let eStart = 0; eStart < totalEsc; eStart += escBatchSize) {
      const escRows: string[] = [];
      const count = Math.min(escBatchSize, totalEsc - eStart);

      for (let j = 0; j < count; j++) {
        const idx = eStart + j;
        const eId = randomUUID();
        escIds.push(eId);
        const refCode = `ESC-${String(idx + 1).padStart(6, "0")}`;
        const raisedById = userIds[idx % userIds.length];
        const subjectId = userIds[(idx + 7) % userIds.length];
        const assignedToId = leadUserIds[idx % leadUserIds.length];
        const cat = ESC_CATEGORIES[idx % ESC_CATEGORIES.length];
        const sev = ESC_SEVERITIES[idx % ESC_SEVERITIES.length];
        const status = ESC_STATUSES[idx % ESC_STATUSES.length];
        const res = status === "RESOLVED" || status === "CLOSED" ? "'Issue investigated and resolution protocol executed.'" : "NULL";
        const dueAt = `2025-0${(idx % 9) + 1}-15 12:00:00+00`;

        escRows.push(`('${eId}', '${refCode}', 'EMPLOYEE', '${raisedById}', '${subjectId}', '${assignedToId}', '${cat}', '${sev}', 'Workplace escalation ticket ${refCode}', 'Formal grievance logged for administrative investigation.', '${status}', ${res}, false, false, '${dueAt}')`);
      }

      await db.execute(sql.raw(`
        INSERT INTO escalations (id, ref_code, origin, raised_by, subject_employee_id, assigned_to, category, severity, title, description, status, resolution, is_confidential, is_anonymous, due_at)
        VALUES ${escRows.join(",")}
      `));
      process.stdout.write(`\r   → Inserted ${eStart + count} / 30,000 escalations`);
    }
    console.log("\n   ✓ 30,000 Escalations seeded.");

    // Comments (100,000)
    console.log("💬 Seeding 100,000 Escalation Comments (batched)...");
    const totalComments = 100000;
    const commentBatchSize = 5000;
    for (let cStart = 0; cStart < totalComments; cStart += commentBatchSize) {
      const commRows: string[] = [];
      const count = Math.min(commentBatchSize, totalComments - cStart);

      for (let j = 0; j < count; j++) {
        const idx = cStart + j;
        const cId = randomUUID();
        const escId = escIds[idx % escIds.length];
        const authorId = userIds[(idx * 3) % userIds.length];
        const vis = idx % 3 === 0 ? "INTERNAL" : "SHARED";
        commRows.push(`('${cId}', '${escId}', '${authorId}', 'Investigation note #${idx + 1} logged with action items.', '${vis}', false)`);
      }

      await db.execute(sql.raw(`
        INSERT INTO escalation_comments (id, escalation_id, author_id, body, visibility, is_status_change)
        VALUES ${commRows.join(",")}
      `));
      process.stdout.write(`\r   → Inserted ${cStart + count} / 100,000 comments`);
    }
    console.log("\n   ✓ 100,000 Comments seeded.");

    // 7. Audit Logs (500,000)
    console.log("📜 Seeding 500,000 Audit Records (batched)...");
    const totalAudit = 500000;
    const auditBatchSize = 10000;
    for (let aStart = 0; aStart < totalAudit; aStart += auditBatchSize) {
      const auditRows: string[] = [];
      const count = Math.min(auditBatchSize, totalAudit - aStart);

      for (let j = 0; j < count; j++) {
        const idx = aStart + j;
        const actorId = userIds[idx % userIds.length];
        const action = AUDIT_ACTIONS[idx % AUDIT_ACTIONS.length];
        const entityType = ["BONUS", "REVIEW", "ESCALATION", "USER"][idx % 4];
        const reqId = randomUUID();
        auditRows.push(`('${actorId}', 'actor.${idx % 500}@pulse.internal', 'USER', '${action}', '${entityType}', '${reqId}', 'Entity #${idx + 1}', '{"ip": "10.0.0.1"}', '{"status": "UPDATED"}', '10.0.0.1', 'Pulse Performance Agent', '${reqId}')`);
      }

      await db.execute(sql.raw(`
        INSERT INTO audit_logs (actor_id, actor_email, actor_role, action, entity_type, entity_id, entity_label, before, after, ip_address, user_agent, request_id)
        VALUES ${auditRows.join(",")}
      `));
      process.stdout.write(`\r   → Inserted ${aStart + count} / 500,000 audit records`);
    }
    console.log("\n   ✓ 500,000 Audit rows seeded.");

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n🎉 VOLUME FIXTURE COMPLETED IN ${durationSec}s!`);

    // Final Proof Verification
    const tables = ["users", "departments", "bonuses", "reviews", "review_ratings", "escalations", "escalation_comments", "audit_logs"];
    console.log("\n📊 FINAL VOLUME FIXTURE ROW COUNTS:");
    for (const t of tables) {
      const countRes = await db.execute(sql.raw(`SELECT count(*)::int as count FROM "${t}"`));
      console.log(`   • ${t.padEnd(22)}: ${countRes.rows[0]?.count?.toLocaleString()}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Volume fixture error:", err);
  process.exit(1);
});
