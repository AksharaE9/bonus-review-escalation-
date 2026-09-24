import { describe, it, expect } from "vitest";
import {
  escStatusEnumValues,
  isValidTransition,
  VALID_TRANSITIONS,
  updateEscalationStatusSchema,
} from "@/lib/validators/escalation";
import { calculateWeightedOverallScore } from "@/lib/validators/review";
import { toPublicUser } from "@/server/repos/user.repo";
import { can } from "@/lib/rbac";
import type { SessionUser } from "@/types";

describe("A3 & A4 · Functional Suite & RBAC Adversarial Matrix", () => {
  describe("7.1 A3 Functional Coverage", () => {
    describe("Escalation Status State Machine (All 49 Pairs)", () => {
      it("evaluates all 49 state pairs against valid transition table", () => {
        const statuses = escStatusEnumValues;
        let legalCount = 0;
        let illegalCount = 0;

        for (const from of statuses) {
          for (const to of statuses) {
            const isAllowed = isValidTransition(from, to);
            const expected =
              from === to ||
              (VALID_TRANSITIONS[from] && VALID_TRANSITIONS[from].includes(to));

            expect(isAllowed).toBe(Boolean(expected));
            if (isAllowed) {
              legalCount++;
            } else {
              illegalCount++;
            }
          }
        }

        // 7 statuses: 7 reflexives + 13 valid transitions = 20 allowed, 29 rejected
        expect(legalCount).toBe(20);
        expect(illegalCount).toBe(29);
      });

      it("rejects resolution with empty or short text when resolving", () => {
        const res = updateEscalationStatusSchema.safeParse({
          status: "RESOLVED",
          resolution: "short",
        });
        expect(res.success).toBe(false);

        const validRes = updateEscalationStatusSchema.safeParse({
          status: "RESOLVED",
          resolution: "The grievance has been resolved after department realignment.",
        });
        expect(validRes.success).toBe(true);
      });
    });

    describe("Review Weighted Overall Score Calculation", () => {
      it("correctly computes weighted mean with weights 1.0, 1.5, 2.0 to 1 decimal place", () => {
        const compWeights = [
          { id: "c1", weight: 1.0 },
          { id: "c2", weight: 1.5 },
          { id: "c3", weight: 2.0 },
        ];

        // Ratings: c1=4.0, c2=5.0, c3=3.5
        // Weighted sum: 4.0*1.0 + 5.0*1.5 + 3.5*2.0 = 4.0 + 7.5 + 7.0 = 18.5
        // Total weight: 1.0 + 1.5 + 2.0 = 4.5
        // Score: 18.5 / 4.5 = 4.1111... -> rounded to 1 decimal: 4.1
        const ratings = [
          { competencyId: "c1", score: 4.0 },
          { competencyId: "c2", score: 5.0 },
          { competencyId: "c3", score: 3.5 },
        ];

        const calculated = calculateWeightedOverallScore(ratings, compWeights);
        expect(calculated).toBe(4.1);
      });

      it("handles string decimal weights correctly from DB", () => {
        const compWeights = [
          { id: "c1", weight: "1.00" },
          { id: "c2", weight: "2.00" },
        ];

        // c1: 3.0 * 1.0 = 3.0, c2: 4.0 * 2.0 = 8.0 -> Sum: 11.0 / 3.0 = 3.666... -> 3.7
        const ratings = [
          { competencyId: "c1", score: 3.0 },
          { competencyId: "c2", score: 4.0 },
        ];

        expect(calculateWeightedOverallScore(ratings, compWeights)).toBe(3.7);
      });
    });
  });

  describe("7.2 A4 RBAC Adversarial Matrix & Core Invariants (I1-I12)", () => {
    const admin: SessionUser = {
      id: "admin-1",
      employeeCode: "ADM001",
      email: "admin@pulse.local",
      fullName: "Admin User",
      role: "ADMIN",
      departmentId: "dept-eng",
    };

    const leadDeptA: SessionUser = {
      id: "lead-1",
      employeeCode: "LEAD001",
      email: "lead.eng@pulse.local",
      fullName: "Lead Eng",
      role: "LEAD",
      departmentId: "dept-eng",
    };

    const userDeptA: SessionUser = {
      id: "user-1",
      employeeCode: "EMP001",
      email: "user.eng@pulse.local",
      fullName: "User Eng",
      role: "USER",
      departmentId: "dept-eng",
    };

    const userDeptB: SessionUser = {
      id: "user-2",
      employeeCode: "EMP002",
      email: "user.mkt@pulse.local",
      fullName: "User Marketing",
      role: "USER",
      departmentId: "dept-mkt",
    };

    it("I1: USER can see ONLY their own records", () => {
      expect(can(userDeptA, "view_own_records", { isOwner: true })).toBe(true);
      expect(can(userDeptA, "view_employee_profile", { targetUserId: userDeptB.id })).toBe(false);
      expect(can(userDeptA, "view_unapproved_bonus_of_others", { targetDepartmentId: "dept-eng" })).toBe(false);
    });

    it("I2: LEAD can see ONLY their department or direct reports", () => {
      expect(can(leadDeptA, "view_employee_profile", { targetDepartmentId: "dept-eng" })).toBe(true);
      expect(can(leadDeptA, "view_employee_profile", { targetDepartmentId: "dept-mkt" })).toBe(false);
      expect(can(leadDeptA, "write_review", { targetDepartmentId: "dept-eng" })).toBe(true);
      expect(can(leadDeptA, "write_review", { targetDepartmentId: "dept-mkt" })).toBe(false);
    });

    it("I3: Bonuses in DRAFT / PENDING / REJECTED are invisible to employee", () => {
      expect(can(userDeptA, "view_unapproved_bonus_of_others")).toBe(false);
      // Lead can only see unapproved bonuses of own department
      expect(can(leadDeptA, "view_unapproved_bonus_of_others", { targetDepartmentId: "dept-eng" })).toBe(true);
      expect(can(leadDeptA, "view_unapproved_bonus_of_others", { targetDepartmentId: "dept-mkt" })).toBe(false);
    });

    it("I6: INTERNAL escalation comments never allowed for USER", () => {
      expect(can(userDeptA, "comment_internal_escalation")).toBe(false);
      expect(can(leadDeptA, "comment_internal_escalation")).toBe(true);
      expect(can(admin, "comment_internal_escalation")).toBe(true);
    });

    it("I7: Anonymous complaint author hidden from LEAD", () => {
      expect(can(leadDeptA, "view_anonymous_complaint_author")).toBe(false);
      expect(can(admin, "view_anonymous_complaint_author")).toBe(true);
    });

    it("I8: Confidential escalations are ADMIN-only (and creator)", () => {
      expect(can(admin, "view_confidential_escalations")).toBe(true);
      expect(can(leadDeptA, "view_confidential_escalations", { targetDepartmentId: "dept-eng" })).toBe(false);
      expect(can(userDeptA, "view_confidential_escalations", { targetUserId: userDeptA.id })).toBe(true);
      expect(can(userDeptA, "view_confidential_escalations", { targetUserId: userDeptB.id })).toBe(false);
    });

    it("I12: password_hash never crosses repository boundary into PublicUser", () => {
      const dbRow = {
        id: "u-123",
        employeeCode: "EMP099",
        email: "test@pulse.local",
        passwordHash: "$2a$12$securehashstringthathouldneverbeleaked",
        fullName: "Test User",
        avatarUrl: null,
        role: "USER" as const,
        departmentId: "d-1",
        status: "ACTIVE" as const,
        mustChangePassword: true,
        createdAt: new Date(),
      };

      const publicUser = toPublicUser(dbRow);
      expect(publicUser).not.toHaveProperty("passwordHash");
      expect(publicUser).not.toHaveProperty("password_hash");
      expect(Object.keys(publicUser)).not.toContain("passwordHash");
    });

    it("Vertical escalation: USER cannot approve bonuses, manage users, or view audit logs", () => {
      expect(can(userDeptA, "approve_bonus")).toBe(false);
      expect(can(userDeptA, "manage_users_roles")).toBe(false);
      expect(can(userDeptA, "view_audit_log")).toBe(false);
      expect(can(userDeptA, "manage_app_settings")).toBe(false);
    });
  });
});
