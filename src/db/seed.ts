import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import type { Role, BonusType, EscalationCategory, EscalationSeverity, EscalationStatus } from "@/types";

dotenv.config();
neonConfig.webSocketConstructor = ws;

// ─── Production guard ────────────────────────────────────────────────────────
// The seed script installs demo data. It must NEVER run against a production
// database unless the operator explicitly sets ALLOW_DEMO_SEED=true.
if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
  console.error("❌ SEED BLOCKED: NODE_ENV=production and ALLOW_DEMO_SEED is not 'true'.");
  console.error("   The demo seed script must not run against a production database.");
  console.error("   To bootstrap a first admin, use: npm run db:bootstrap-admin");
  process.exit(1);
}
// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!url || url.trim() === "") {
    console.error("❌ Seed failed: DATABASE_URL is not set.");
    process.exit(1);
  }

  console.log("🌱 Initializing Pulse Expanded Seed Engine (Realistic Dataset)...");

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  try {
    // 1. Truncate existing data in reverse dependency order
    console.log("🧹 Clearing existing records for clean idempotent seed...");
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

    // 2. App Settings
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

    // 3. Competencies
    console.log("🎯 Seeding 8 Performance Competencies...");
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
    const insertedCompetencies = await db.insert(schema.competencies).values(competencyData).returning();

    // 4. Departments
    console.log("🏢 Seeding 3 Departments...");
    const departmentData = [
      { name: "Engineering", code: "ENG" },
      { name: "Product & Design", code: "PRD" },
      { name: "Operations & Support", code: "OPS" },
    ];
    const insertedDepts = await db.insert(schema.departments).values(departmentData).returning();
    const deptMap = new Map(insertedDepts.map((d) => [d.code, d.id]));

    // 5. Password Hashes from Environment Configuration
    console.log("🔒 Generating password hashes...");
    const adminPassword = process.env.ADMIN_PASSWORD || "AdminSecure#2026!";
    const leadPassword = process.env.LEAD_PASSWORD || "LeadSecure#2026!";
    const userPassword = process.env.USER_PASSWORD || "UserSecure#2026!";

    const adminHash = await bcrypt.hash(adminPassword, 10);
    const leadHash = await bcrypt.hash(leadPassword, 10);
    const userHash = await bcrypt.hash(userPassword, 10);

    // 6. Users: 1 Admin, 3 Leads, 12 Employees (Total 16 users)
    console.log("👥 Seeding 16 Users (1 Admin, 3 Leads, 12 Employees)...");
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
        sessionVersion: 1,
      },
      // 3 Leads
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
        sessionVersion: 1,
      },
      {
        employeeCode: "EMP003",
        email: "lead.prd@pulse.local",
        passwordHash: leadHash,
        fullName: "Ananya Roy",
        role: "LEAD" as const,
        departmentId: deptMap.get("PRD")!,
        designation: "Head of Product",
        dateOfJoining: "2021-08-01",
        phone: "+91 98765 43212",
        status: "ACTIVE" as const,
        mustChangePassword: false,
        sessionVersion: 1,
      },
      {
        employeeCode: "EMP004",
        email: "lead.ops@pulse.local",
        passwordHash: leadHash,
        fullName: "Vikramaditya Nair",
        role: "LEAD" as const,
        departmentId: deptMap.get("OPS")!,
        designation: "VP of Operations",
        dateOfJoining: "2021-09-10",
        phone: "+91 98765 43213",
        status: "ACTIVE" as const,
        mustChangePassword: false,
        sessionVersion: 1,
      },
      // 12 Employees
      {
        employeeCode: "EMP005",
        email: "user@pulse.local",
        passwordHash: userHash,
        fullName: "Arjun Verma",
        role: "USER" as const,
        departmentId: deptMap.get("ENG")!,
        designation: "Lead Frontend Engineer",
        dateOfJoining: "2022-01-10",
        phone: "+91 98765 43220",
        status: "ACTIVE" as const,
        mustChangePassword: false,
        sessionVersion: 1,
      },
      {
        employeeCode: "EMP006",
        email: "sneha.kulkarni@pulse.local",
        passwordHash: userHash,
        fullName: "Sneha Kulkarni",
        role: "USER" as const,
        departmentId: deptMap.get("ENG")!,
        designation: "Senior Backend Engineer",
        dateOfJoining: "2022-02-15",
        phone: "+91 98765 43221",
        status: "ACTIVE" as const,
        mustChangePassword: false,
        sessionVersion: 1,
      },
      {
        employeeCode: "EMP007",
        email: "devendra.patil@pulse.local",
        passwordHash: userHash,
        fullName: "Devendra Patil",
        role: "USER" as const,
        departmentId: deptMap.get("ENG")!,
        designation: "Staff Systems Engineer",
        dateOfJoining: "2022-03-01",
        phone: "+91 98765 43222",
        status: "ACTIVE" as const,
        mustChangePassword: false,
        sessionVersion: 1,
      },
      {
        employeeCode: "EMP008",
        email: "kavita.sundaram@pulse.local",
        passwordHash: userHash,
        fullName: "Kavita Sundaram",
        role: "USER" as const,
        departmentId: deptMap.get("ENG")!,
        designation: "QA Lead Engineer",
        dateOfJoining: "2022-04-12",
        phone: "+91 98765 43223",
        status: "ACTIVE" as const,
        mustChangePassword: false,
        sessionVersion: 1,
      },
      {
        employeeCode: "EMP009",
        email: "rohan.iyer@pulse.local",
        passwordHash: userHash,
        fullName: "Rohan Iyer",
        role: "USER" as const,
        departmentId: deptMap.get("PRD")!,
        designation: "Senior Product Designer",
        dateOfJoining: "2022-05-20",
        phone: "+91 98765 43224",
        status: "ACTIVE" as const,
        mustChangePassword: false,
        sessionVersion: 1,
      },
      {
        employeeCode: "EMP010",
        email: "meera.nambiar@pulse.local",
        passwordHash: userHash,
        fullName: "Meera Nambiar",
        role: "USER" as const,
        departmentId: deptMap.get("PRD")!,
        designation: "Product Manager - Core",
        dateOfJoining: "2022-06-01",
        phone: "+91 98765 43225",
        status: "ACTIVE" as const,
        mustChangePassword: false,
        sessionVersion: 1,
      },
      {
        employeeCode: "EMP011",
        email: "tanmay.sengupta@pulse.local",
        passwordHash: userHash,
        fullName: "Tanmay Sengupta",
        role: "USER" as const,
        departmentId: deptMap.get("PRD")!,
        designation: "UX Researcher",
        dateOfJoining: "2022-07-15",
        phone: "+91 98765 43226",
        status: "ACTIVE" as const,
        mustChangePassword: false,
        sessionVersion: 1,
      },
      {
        employeeCode: "EMP012",
        email: "pooja.bhatia@pulse.local",
        passwordHash: userHash,
        fullName: "Pooja Bhatia",
        role: "USER" as const,
        departmentId: deptMap.get("OPS")!,
        designation: "Customer Success Lead",
        dateOfJoining: "2022-08-01",
        phone: "+91 98765 43227",
        status: "ACTIVE" as const,
        mustChangePassword: false,
        sessionVersion: 1,
      },
      {
        employeeCode: "EMP013",
        email: "aditi.deshmukh@pulse.local",
        passwordHash: userHash,
        fullName: "Aditi Deshmukh",
        role: "USER" as const,
        departmentId: deptMap.get("OPS")!,
        designation: "Operations Lead",
        dateOfJoining: "2022-09-10",
        phone: "+91 98765 43228",
        status: "ACTIVE" as const,
        mustChangePassword: false,
        sessionVersion: 1,
      },
      {
        employeeCode: "EMP014",
        email: "sameer.joshi@pulse.local",
        passwordHash: userHash,
        fullName: "Sameer Joshi",
        role: "USER" as const,
        departmentId: deptMap.get("OPS")!,
        designation: "IT Infrastructure Specialist",
        dateOfJoining: "2022-10-05",
        phone: "+91 98765 43229",
        status: "ACTIVE" as const,
        mustChangePassword: false,
        sessionVersion: 1,
      },
      {
        employeeCode: "EMP015",
        email: "sunita.rao@pulse.local",
        passwordHash: userHash,
        fullName: "Sunita Rao",
        role: "USER" as const,
        departmentId: deptMap.get("ENG")!,
        designation: "Security & Compliance Engineer",
        dateOfJoining: "2022-11-01",
        phone: "+91 98765 43230",
        status: "ACTIVE" as const,
        mustChangePassword: false,
        sessionVersion: 1,
      },
      {
        employeeCode: "EMP016",
        email: "siddharth.mukherjee@pulse.local",
        passwordHash: userHash,
        fullName: "Siddharth Mukherjee",
        role: "USER" as const,
        departmentId: deptMap.get("ENG")!,
        designation: "DevOps Engineer",
        dateOfJoining: "2022-12-01",
        phone: "+91 98765 43231",
        status: "ACTIVE" as const,
        mustChangePassword: false,
        sessionVersion: 1,
      },
    ];

    const insertedUsers = await db.insert(schema.users).values(usersToInsert).returning();
    const userMap = new Map(insertedUsers.map((u) => [u.email, u]));
    const adminUser = userMap.get("admin@pulse.local")!;
    const engLead = userMap.get("lead@pulse.local")!;
    const prdLead = userMap.get("lead.prd@pulse.local")!;
    const opsLead = userMap.get("lead.ops@pulse.local")!;

    // Assign direct managers to users
    await db.update(schema.users).set({ managerId: engLead.id }).where(sql`email IN ('user@pulse.local', 'sneha.kulkarni@pulse.local', 'devendra.patil@pulse.local', 'kavita.sundaram@pulse.local', 'sunita.rao@pulse.local', 'siddharth.mukherjee@pulse.local')`);
    await db.update(schema.users).set({ managerId: prdLead.id }).where(sql`email IN ('rohan.iyer@pulse.local', 'meera.nambiar@pulse.local', 'tanmay.sengupta@pulse.local')`);
    await db.update(schema.users).set({ managerId: opsLead.id }).where(sql`email IN ('pooja.bhatia@pulse.local', 'aditi.deshmukh@pulse.local', 'sameer.joshi@pulse.local')`);

    // 7. Review Cycle
    console.log("📅 Seeding Review Cycle...");
    const [reviewCycle] = await db.insert(schema.reviewCycles).values([
      {
        name: "FY 2025 Annual Appraisal Cycle",
        reviewType: "ANNUAL",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        isOpen: true,
      },
    ]).returning();

    // 8. Seed 32 Bonuses Across All Statuses
    console.log("💰 Seeding 32 Realistic Merit & Spot Bonuses...");
    const bonusDataset: (typeof schema.bonuses.$inferInsert)[] = [
      // Approved & Paid Bonuses
      {
        employeeId: userMap.get("user@pulse.local")!.id,
        awardedBy: engLead.id,
        approvedBy: adminUser.id,
        amount: "75000.00",
        bonusType: "PERFORMANCE",
        status: "PAID",
        reason: "Exceptional leadership in architecting the high-concurrency client console with zero latency regression.",
        periodMonth: "2025-01-01",
        approvedAt: new Date("2025-01-15"),
        payoutDate: "2025-01-28",
      },
      {
        employeeId: userMap.get("sneha.kulkarni@pulse.local")!.id,
        awardedBy: engLead.id,
        approvedBy: adminUser.id,
        amount: "50000.00",
        bonusType: "SPOT",
        status: "PAID",
        reason: "Emergency root-cause resolution and real-time database connection pooling hotfix during peak traffic.",
        periodMonth: "2025-01-01",
        approvedAt: new Date("2025-01-20"),
        payoutDate: "2025-01-28",
      },
      {
        employeeId: userMap.get("devendra.patil@pulse.local")!.id,
        awardedBy: engLead.id,
        approvedBy: adminUser.id,
        amount: "120000.00",
        bonusType: "PROJECT",
        status: "APPROVED",
        reason: "Flawless migration of core transactional clusters to Neon serverless infrastructure ahead of schedule.",
        periodMonth: "2025-02-01",
        approvedAt: new Date("2025-02-10"),
      },
      {
        employeeId: userMap.get("rohan.iyer@pulse.local")!.id,
        awardedBy: prdLead.id,
        approvedBy: adminUser.id,
        amount: "60000.00",
        bonusType: "PERFORMANCE",
        status: "PAID",
        reason: "Delivered comprehensive accessible design system overhaul across all primary customer workflows.",
        periodMonth: "2025-01-01",
        approvedAt: new Date("2025-01-18"),
        payoutDate: "2025-01-28",
      },
      {
        employeeId: userMap.get("pooja.bhatia@pulse.local")!.id,
        awardedBy: opsLead.id,
        approvedBy: adminUser.id,
        amount: "45000.00",
        bonusType: "SPOT",
        status: "APPROVED",
        reason: "Maintained 99.8% customer satisfaction score across 450+ resolution tickets during product rollout.",
        periodMonth: "2025-02-01",
        approvedAt: new Date("2025-02-14"),
      },
      // Pending Approval Bonuses (Awaiting Admin)
      {
        employeeId: userMap.get("user@pulse.local")!.id,
        awardedBy: engLead.id,
        approvedBy: null,
        amount: "40000.00",
        bonusType: "MILESTONE",
        status: "PENDING_APPROVAL",
        reason: "Successful delivery of real-time audit event streaming and secure log aggregation module.",
        periodMonth: "2025-02-01",
      },
      {
        employeeId: userMap.get("kavita.sundaram@pulse.local")!.id,
        awardedBy: engLead.id,
        approvedBy: null,
        amount: "35000.00",
        bonusType: "PERFORMANCE",
        status: "PENDING_APPROVAL",
        reason: "Built end-to-end automated Playwright test suite achieving 100% regression test coverage.",
        periodMonth: "2025-02-01",
      },
      {
        employeeId: userMap.get("meera.nambiar@pulse.local")!.id,
        awardedBy: prdLead.id,
        approvedBy: null,
        amount: "55000.00",
        bonusType: "PROJECT",
        status: "PENDING_APPROVAL",
        reason: "Spearheaded user research and roadmap execution for enterprise multi-tenancy capabilities.",
        periodMonth: "2025-02-01",
      },
      {
        employeeId: userMap.get("aditi.deshmukh@pulse.local")!.id,
        awardedBy: opsLead.id,
        approvedBy: null,
        amount: "30000.00",
        bonusType: "SPOT",
        status: "PENDING_APPROVAL",
        reason: "Rapid mitigation and client coordination for high-priority service level SLA adherence.",
        periodMonth: "2025-02-01",
      },
      // Rejected Bonuses (With Mandatory Rejection Reasons)
      {
        employeeId: userMap.get("sameer.joshi@pulse.local")!.id,
        awardedBy: opsLead.id,
        approvedBy: adminUser.id,
        amount: "80000.00",
        bonusType: "RETENTION",
        status: "REJECTED",
        reason: "Retention incentive proposed prior to formal annual compensation cycle review.",
        rejectionReason: "Retention bonuses are evaluated strictly during the Q3 executive review window.",
        periodMonth: "2025-01-01",
      },
      {
        employeeId: userMap.get("tanmay.sengupta@pulse.local")!.id,
        awardedBy: prdLead.id,
        approvedBy: adminUser.id,
        amount: "25000.00",
        bonusType: "OTHER",
        status: "REJECTED",
        reason: "Ad-hoc milestone bonus for conference presentation representing company engineering.",
        rejectionReason: "Conference representations fall under standard travel and sponsorship policy guidelines.",
        periodMonth: "2025-01-01",
      },
      // Draft & Cancelled Bonuses
      {
        employeeId: userMap.get("sunita.rao@pulse.local")!.id,
        awardedBy: engLead.id,
        approvedBy: null,
        amount: "50000.00",
        bonusType: "PERFORMANCE",
        status: "DRAFT",
        reason: "Ongoing review for security vulnerability triage and automated CVE patch pipeline setup.",
        periodMonth: "2025-02-01",
      },
      {
        employeeId: userMap.get("siddharth.mukherjee@pulse.local")!.id,
        awardedBy: engLead.id,
        approvedBy: null,
        amount: "30000.00",
        bonusType: "SPOT",
        status: "CANCELLED",
        reason: "Duplicate submission initially raised before formal project completion validation.",
        periodMonth: "2025-01-01",
      },
    ];

    // Expand remaining bonuses to reach 32
    for (let i = 0; i < 19; i++) {
      const emp = insertedUsers[(i % 12) + 4];
      const lead = insertedUsers[(i % 3) + 1];
      const isApproved = i % 2 === 0;
      bonusDataset.push({
        employeeId: emp.id,
        awardedBy: lead.id,
        approvedBy: isApproved ? adminUser.id : null,
        amount: `${(20000 + (i * 3500)).toFixed(2)}`,
        bonusType: (["PERFORMANCE", "SPOT", "REFERRAL", "FESTIVE", "PROJECT"] as BonusType[])[i % 5],
        status: isApproved ? "APPROVED" : "PENDING_APPROVAL",
        reason: `Consistent dedication and measurable impact delivered during sprint cycle ${i + 1} project deliverables.`,
        periodMonth: "2025-02-01",
        approvedAt: isApproved ? new Date() : null,
      });
    }

    await db.insert(schema.bonuses).values(bonusDataset);

    // 9. Seed 18 Performance Reviews with Competency Ratings
    console.log("📝 Seeding 18 Performance Reviews with Competency Scores...");
    for (let i = 0; i < 18; i++) {
      const emp = insertedUsers[(i % 12) + 4];
      const lead = insertedUsers[(i % 3) + 1];
      const isAcknowledged = i < 10;

      const [review] = await db.insert(schema.reviews).values({
        employeeId: emp.id,
        reviewerId: lead.id,
        cycleId: reviewCycle.id,
        reviewType: "ANNUAL",
        periodStart: "2025-01-01",
        periodEnd: "2025-12-31",
        status: isAcknowledged ? "ACKNOWLEDGED" : "SUBMITTED",
        overallRating: `${(3.8 + ((i % 5) * 0.25)).toFixed(1)}`,
        summary: "Demonstrates exceptional technical ownership, unblocks cross-functional teams, and communicates proactively.",
        strengths: "Deep domain knowledge, high code quality, and active participation in design discussions.",
        improvements: "Continue delegating architectural sub-tasks and mentoring junior team members during sprint planning.",
        goals: [
          { title: "Automate Continuous Integration", targetDate: "2025-06-30" },
          { title: "Publish Engineering Architecture Guidelines", targetDate: "2025-09-30" },
        ],
        submittedAt: new Date("2025-01-20"),
        acknowledgedAt: isAcknowledged ? new Date("2025-01-25") : null,
        employeeComment: isAcknowledged ? "I appreciate the detailed feedback and look forward to leading the test automation initiatives." : null,
      }).returning();

      // Insert Ratings for all 8 competencies
      const ratingsData = insertedCompetencies.map((comp, idx) => ({
        reviewId: review.id,
        competencyId: comp.id,
        score: `${Math.min(5, Math.max(3, 4 + ((idx + i) % 2) - ((idx % 3 === 0) ? 1 : 0))).toFixed(1)}`,
        comment: `Demonstrates high proficiency and dependable execution in ${comp.name}.`,
      }));

      await db.insert(schema.reviewRatings).values(ratingsData);
    }

    // 10. Seed 20 Escalations (Including 3 Overdue & 2 Anonymous)
    console.log("🚨 Seeding 20 Escalations (3 SLA Breached, 2 Anonymous, Threaded Comments)...");
    const escalationDataset: (typeof schema.escalations.$inferInsert)[] = [
      // 1. Critical Overdue Escalation (SLA Breached)
      {
        refCode: "ESC-2025-0001",
        origin: "EMPLOYEE" as const,
        raisedBy: userMap.get("user@pulse.local")!.id,
        subjectEmployeeId: userMap.get("user@pulse.local")!.id,
        assignedTo: engLead.id,
        title: "Production Database CPU Saturation During End-of-Month Payroll Export",
        description: "Severe query latency observed during simultaneous payroll ledger computation causing export worker timeouts.",
        category: "PERFORMANCE" as EscalationCategory,
        severity: "CRITICAL" as EscalationSeverity,
        status: "IN_PROGRESS" as EscalationStatus,
        dueAt: new Date(Date.now() - (48 * 3600 * 1000)), // Overdue by 48 hours
        isConfidential: false,
        isAnonymous: false,
        createdAt: new Date(Date.now() - (72 * 3600 * 1000)),
      },
      // 2. High Severity Overdue Escalation
      {
        refCode: "ESC-2025-0002",
        origin: "EMPLOYEE" as const,
        raisedBy: userMap.get("pooja.bhatia@pulse.local")!.id,
        subjectEmployeeId: userMap.get("pooja.bhatia@pulse.local")!.id,
        assignedTo: opsLead.id,
        title: "Single Sign-On SAML Certificate Expiry Warning from Client SSO Provider",
        description: "Enterprise tenant client SSO certificates expiring within 24 hours with immediate authentication disruption risk.",
        category: "IT_ASSET" as EscalationCategory,
        severity: "HIGH" as EscalationSeverity,
        status: "OPEN" as EscalationStatus,
        dueAt: new Date(Date.now() - (12 * 3600 * 1000)), // Overdue by 12 hours
        isConfidential: false,
        isAnonymous: false,
        createdAt: new Date(Date.now() - (36 * 3600 * 1000)),
      },
      // 3. Medium Severity Overdue Escalation
      {
        refCode: "ESC-2025-0003",
        origin: "MANAGEMENT" as const,
        raisedBy: engLead.id,
        subjectEmployeeId: userMap.get("sneha.kulkarni@pulse.local")!.id,
        assignedTo: engLead.id,
        title: "Automated Backup Snapshot Retention Verification Required",
        description: "Need verification for secondary replica backup rotation policies to ensure full disaster recovery readiness.",
        category: "POLICY_VIOLATION" as EscalationCategory,
        severity: "MEDIUM" as EscalationSeverity,
        status: "OPEN" as EscalationStatus,
        dueAt: new Date(Date.now() - (24 * 3600 * 1000)), // Overdue by 24 hours
        isConfidential: false,
        isAnonymous: false,
        createdAt: new Date(Date.now() - (96 * 3600 * 1000)),
      },
      // 4. Anonymous Complaint 1
      {
        refCode: "ESC-2025-0004",
        origin: "EMPLOYEE" as const,
        raisedBy: userMap.get("devendra.patil@pulse.local")!.id,
        subjectEmployeeId: null,
        assignedTo: adminUser.id,
        title: "Workplace Resource Allocation & Overtime Coordination Inquiry",
        description: "Concerns regarding uneven weekend on-call distribution and lack of compensatory time-off tracking.",
        category: "WORKPLACE" as EscalationCategory,
        severity: "MEDIUM" as EscalationSeverity,
        status: "ACKNOWLEDGED" as EscalationStatus,
        dueAt: new Date(Date.now() + (48 * 3600 * 1000)),
        isConfidential: true,
        isAnonymous: true,
        createdAt: new Date(),
      },
      // 5. Anonymous Complaint 2
      {
        refCode: "ESC-2025-0005",
        origin: "EMPLOYEE" as const,
        raisedBy: userMap.get("tanmay.sengupta@pulse.local")!.id,
        subjectEmployeeId: null,
        assignedTo: adminUser.id,
        title: "Feedback on Sprint Retrospective Action Items Follow-Through",
        description: "Constructive feedback regarding psychological safety and meeting cadence during cross-functional sprint planning.",
        category: "INTERPERSONAL" as EscalationCategory,
        severity: "LOW" as EscalationSeverity,
        status: "IN_PROGRESS" as EscalationStatus,
        dueAt: new Date(Date.now() + (96 * 3600 * 1000)),
        isConfidential: true,
        isAnonymous: true,
        createdAt: new Date(),
      },
      // 6. Resolved Escalation with Resolution Summary
      {
        refCode: "ESC-2025-0006",
        origin: "EMPLOYEE" as const,
        raisedBy: userMap.get("user@pulse.local")!.id,
        subjectEmployeeId: userMap.get("user@pulse.local")!.id,
        assignedTo: engLead.id,
        title: "Development Environment Seed Script Timeout Resolution",
        description: "Local development database seeding timed out due to missing foreign key index during cascade deletion.",
        category: "PERFORMANCE" as EscalationCategory,
        severity: "MEDIUM" as EscalationSeverity,
        status: "RESOLVED" as EscalationStatus,
        resolution: "Added compound index on cascade tables and optimized batch insert transaction in seed engine.",
        resolvedAt: new Date(),
        dueAt: new Date(Date.now() + (48 * 3600 * 1000)),
        isConfidential: false,
        isAnonymous: false,
        createdAt: new Date(Date.now() - (48 * 3600 * 1000)),
      },
    ];

    // Fill remaining escalations to reach 20
    for (let i = 7; i <= 20; i++) {
      const emp = insertedUsers[(i % 12) + 4];
      const lead = insertedUsers[(i % 3) + 1];
      const isResolved = i > 15;
      const refCode = `ESC-2025-${i.toString().padStart(4, "0")}`;

      escalationDataset.push({
        refCode,
        origin: i % 2 === 0 ? ("EMPLOYEE" as const) : ("MANAGEMENT" as const),
        raisedBy: emp.id,
        subjectEmployeeId: emp.id,
        assignedTo: lead.id,
        title: `Operational Workflow Triage & Governance Issue #${i}`,
        description: `Detailed operational inquiry and workflow coordination ticket regarding department deliverables for cycle ${i}.`,
        category: (["PERFORMANCE", "ATTENDANCE", "BEHAVIOUR", "POLICY_VIOLATION", "CLIENT_COMPLAINT", "PAYROLL"] as EscalationCategory[])[i % 6],
        severity: (["LOW", "MEDIUM", "HIGH", "CRITICAL"] as EscalationSeverity[])[i % 4],
        status: isResolved ? "RESOLVED" : ((["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "AWAITING_EMPLOYEE"] as EscalationStatus[])[i % 4]),
        resolution: isResolved ? "The reported workflow query was reviewed by department leadership and resolved satisfactorily." : undefined,
        resolvedAt: isResolved ? new Date() : undefined,
        dueAt: new Date(Date.now() + ((i * 12) * 3600 * 1000)),
        isConfidential: i % 5 === 0,
        isAnonymous: false,
        createdAt: new Date(Date.now() - (i * 3600 * 1000)),
      });
    }

    const insertedEscalations = await db.insert(schema.escalations).values(escalationDataset).returning();

    // 11. Add Threaded Comments on Escalations (Internal & Shared)
    console.log("💬 Adding Threaded Internal & Shared Escalation Comments...");
    const commentsData = [
      {
        escalationId: insertedEscalations[0].id,
        authorId: engLead.id,
        body: "Investigating server query plans with PostgreSQL pg_stat_statements. Identified missing index on bonus employee relation.",
        visibility: "INTERNAL" as const,
      },
      {
        escalationId: insertedEscalations[0].id,
        authorId: engLead.id,
        body: "We have deployed a query optimization hotfix to the staging environment and are verifying export execution times.",
        visibility: "SHARED" as const,
      },
      {
        escalationId: insertedEscalations[3].id,
        authorId: adminUser.id,
        body: "Reviewing company on-call scheduling guidelines. Will propose rotational schedule updates at the upcoming leadership sync.",
        visibility: "INTERNAL" as const,
      },
      {
        escalationId: insertedEscalations[3].id,
        authorId: adminUser.id,
        body: "Thank you for the constructive feedback. People Operations is actively balancing on-call rotations across departments.",
        visibility: "SHARED" as const,
      },
    ];
    await db.insert(schema.escalationComments).values(commentsData);

    // 12. Seed System Audit Logs
    console.log("📜 Seeding Initial System Audit Logs...");
    await db.insert(schema.auditLogs).values([
      {
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        actorRole: "ADMIN" as Role,
        action: "CREATE" as const,
        entityType: "system",
        entityId: "system_init",
        entityLabel: "Pulse Enterprise Initial Provisioning",
        before: null,
        after: {
          organization: "Pulse Enterprises Ltd",
          admin: adminUser.email,
          totalUsers: insertedUsers.length,
          totalDepts: insertedDepts.length,
        },
        changedFields: ["system_init"],
        ipAddress: "127.0.0.1",
        userAgent: "PulseProvisioningEngine/2.0",
        createdAt: new Date(),
      },
    ]);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ PULSE EXPANDED SEED COMPLETED SUCCESSFULLY!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Summary of Provisioned Entities:");
    console.log(`   • Departments     : ${insertedDepts.length}`);
    console.log(`   • Users           : ${insertedUsers.length} (1 Admin, 3 Leads, 12 Employees)`);
    console.log(`   • Competencies    : ${insertedCompetencies.length}`);
    console.log(`   • Review Cycles   : 1`);
    console.log(`   • Bonuses         : ${bonusDataset.length}`);
    console.log(`   • Reviews         : 18 (with full competency rating matrices)`);
    console.log(`   • Escalations     : ${insertedEscalations.length} (3 SLA Overdue, 2 Anonymous)`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔑 ACCOUNTS PROVISIONED VIA ENVIRONMENT SECRETS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
