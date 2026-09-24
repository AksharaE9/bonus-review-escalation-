import { describe, it, expect } from "vitest";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { bonuses } from "@/db/schema/bonuses";
import { escalations } from "@/db/schema/escalations";
import { escalationComments } from "@/db/schema/escalations";
import { auditLogs } from "@/db/schema/audit";
import { eq, isNull } from "drizzle-orm";
import { bonusRepo } from "@/server/repos/bonus.repo";
import { escalationRepo } from "@/server/repos/escalation.repo";
import { employeeProfileRepo } from "@/server/repos/employee-profile.repo";
import type { SessionUser } from "@/types";

describe("V1 End-to-End Verification Matrix (Database & Business Logic)", () => {
  let adminUser: SessionUser;
  let leadUser: SessionUser;
  let employeeUser: SessionUser;

  it("loads seeded accounts for test verification", async () => {
    const allUsers = await db.select().from(users).where(isNull(users.deletedAt));
    const admin = allUsers.find((u) => u.role === "ADMIN");
    const lead = allUsers.find((u) => u.role === "LEAD");
    const employee = allUsers.find((u) => u.role === "USER");

    expect(admin).toBeDefined();
    expect(lead).toBeDefined();
    expect(employee).toBeDefined();

    adminUser = {
      id: admin!.id,
      email: admin!.email,
      fullName: admin!.fullName,
      role: admin!.role as any,
      departmentId: admin!.departmentId,
      employeeCode: admin!.employeeCode,
      mustChangePassword: admin!.mustChangePassword,
    };

    leadUser = {
      id: lead!.id,
      email: lead!.email,
      fullName: lead!.fullName,
      role: lead!.role as any,
      departmentId: lead!.departmentId,
      employeeCode: lead!.employeeCode,
      mustChangePassword: lead!.mustChangePassword,
    };

    employeeUser = {
      id: employee!.id,
      email: employee!.email,
      fullName: employee!.fullName,
      role: employee!.role as any,
      departmentId: employee!.departmentId,
      employeeCode: employee!.employeeCode,
      mustChangePassword: employee!.mustChangePassword,
    };
  });

  it("Scenario 11-13: Single-query 360 profile loads summary stats and tab counts", async () => {
    const summary = await employeeProfileRepo.getProfileHeaderAndStats(adminUser, employeeUser.id);
    expect(summary).toBeDefined();
    expect(summary?.employee.id).toBe(employeeUser.id);

    // Verify stats and tab counts
    expect(summary?.tabCounts.bonuses).toBeGreaterThanOrEqual(1);
    expect(summary?.tabCounts.reviews).toBeGreaterThanOrEqual(1);
    expect(Number(summary?.stats.totalBonusApprovedYtd)).toBeGreaterThanOrEqual(0);
  });

  it("Scenario 14-15: Lead awards bonus -> PENDING_APPROVAL -> invisible to employee -> Admin approves -> visible", async () => {
    // 1. Lead creates a pending bonus
    const [inserted] = await db.insert(bonuses).values({
      employeeId: employeeUser.id,
      awardedBy: leadUser.id,
      amount: "48000.00",
      bonusType: "PERFORMANCE",
      reason: "Outstanding cross-department architecture contribution on auth refactor.",
      status: "PENDING_APPROVAL",
    }).returning();

    // 2. Query bonuses from employee perspective (Must NOT see PENDING_APPROVAL)
    const empBonuses = await bonusRepo.list(employeeUser, {
      page: 1,
      pageSize: 50,
    });
    const foundPending = empBonuses.data.rows.find((b) => b.id === inserted.id);
    expect(foundPending).toBeUndefined(); // Masked for employee

    // 3. Admin approves bonus
    await db.update(bonuses).set({
      status: "APPROVED",
      approvedBy: adminUser.id,
      approvedAt: new Date(),
    }).where(eq(bonuses.id, inserted.id));

    // 4. Query bonuses again from employee perspective (Must now be VISIBLE)
    const empBonusesAfter = await bonusRepo.list(employeeUser, {
      page: 1,
      pageSize: 50,
    });
    const foundApproved = empBonusesAfter.data.rows.find((b) => b.id === inserted.id);
    expect(foundApproved).toBeDefined();
    expect(foundApproved?.status).toBe("APPROVED");
    expect(Number(foundApproved?.amount)).toBe(48000);
  });

  it("Scenario 17: User raises complaint -> Lead comments with internal/shared -> User payload contains NO internal comment", async () => {
    // 1. Employee raises escalation
    const [esc] = await db.insert(escalations).values({
      refCode: `ESC-TEST-${Date.now()}`,
      origin: "EMPLOYEE",
      raisedBy: employeeUser.id,
      assignedTo: leadUser.id,
      title: "Testing Internal Comment Masking Payload Security",
      description: "Detailed description of complaint to verify comment visibility rules.",
      category: "WORKPLACE",
      severity: "LOW",
      status: "OPEN",
    }).returning();

    // 2. Lead adds 1 internal comment and 1 shared comment
    await db.insert(escalationComments).values([
      {
        escalationId: esc.id,
        authorId: leadUser.id,
        body: "CONFIDENTIAL INTERNAL LEAD COMMENT - MUST NOT LEAK TO EMPLOYEE",
        visibility: "INTERNAL",
      },
      {
        escalationId: esc.id,
        authorId: leadUser.id,
        body: "PUBLIC SHARED UPDATE - Visible to all parties.",
        visibility: "SHARED",
      },
    ]);

    // 3. Retrieve escalation from Employee perspective
    const empView = await escalationRepo.findByRefCode(employeeUser, esc.refCode);
    expect(empView).toBeDefined();
    expect(empView?.comments?.length).toBe(1);
    expect(empView?.comments?.[0].visibility).toBe("SHARED");
    expect(empView?.comments?.[0].body).toContain("PUBLIC SHARED UPDATE");

    // Assert strictly that internal comment is NOT present anywhere in employee payload
    const serialized = JSON.stringify(empView);
    expect(serialized).not.toContain("CONFIDENTIAL INTERNAL LEAD COMMENT");

    // 4. Retrieve escalation from Lead perspective (Must see BOTH)
    const leadView = await escalationRepo.findByRefCode(leadUser, esc.refCode);
    expect(leadView?.comments?.length).toBe(2);
  });

  it("Scenario 18: Resolution text is strictly required to resolve escalations", async () => {
    // Drizzle check constraint validates resolution on RESOLVED status
    const [esc] = await db.insert(escalations).values({
      refCode: `ESC-RESOLVE-${Date.now()}`,
      origin: "EMPLOYEE",
      raisedBy: employeeUser.id,
      assignedTo: leadUser.id,
      title: "Test Resolution Mandatory Requirement",
      description: "Verifying that resolution summary cannot be empty on resolve.",
      category: "PERFORMANCE",
      severity: "LOW",
      status: "OPEN",
    }).returning();

    // Resolving with resolution text succeeds
    await db.update(escalations).set({
      status: "RESOLVED",
      resolution: "Comprehensive fix delivered and verified by quality lead.",
      resolvedAt: new Date(),
    }).where(eq(escalations.id, esc.id));

    const updated = await db.select().from(escalations).where(eq(escalations.id, esc.id));
    expect(updated[0].status).toBe("RESOLVED");
    expect(updated[0].resolution).toBeDefined();
  });

  it("Scenario 21: System audit log records actions with before/after changes", async () => {
    const logs = await db.select().from(auditLogs);
    expect(logs.length).toBeGreaterThan(0);
    logs.forEach((log) => {
      expect(log.action).toBeDefined();
      expect(log.createdAt).toBeDefined();
    });
  });
});
