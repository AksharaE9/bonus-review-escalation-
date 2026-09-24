import { describe, it, expect } from "vitest";
import { can } from "./rbac";
import type { SessionUser } from "@/types";

describe("RBAC Matrix Verification (Section 9)", () => {
  const adminActor: SessionUser = {
    id: "admin-uuid-1",
    employeeCode: "EMP001",
    email: "admin@pulse.local",
    fullName: "Priya Sharma",
    role: "ADMIN",
    departmentId: "dept-eng",
  };

  const leadActor: SessionUser = {
    id: "lead-uuid-2",
    employeeCode: "EMP002",
    email: "lead@pulse.local",
    fullName: "Rajesh Menon",
    role: "LEAD",
    departmentId: "dept-eng",
  };

  const userActor: SessionUser = {
    id: "user-uuid-3",
    employeeCode: "EMP005",
    email: "user@pulse.local",
    fullName: "Rohan Gupta",
    role: "USER",
    departmentId: "dept-eng",
  };

  const externalUserActor: SessionUser = {
    id: "user-uuid-4",
    employeeCode: "EMP010",
    email: "other@pulse.local",
    fullName: "Meera Sen",
    role: "USER",
    departmentId: "dept-prd",
  };

  // 1. View own records
  it("1. View own bonus/review/escalation records", () => {
    expect(can(adminActor, "view_own_records", { isOwner: true })).toBe(true);
    expect(can(leadActor, "view_own_records", { isOwner: true })).toBe(true);
    expect(can(userActor, "view_own_records", { isOwner: true })).toBe(true);
  });

  // 2. View employee profile
  it("2. View employee profile", () => {
    // Admin sees any profile
    expect(can(adminActor, "view_employee_profile", { targetUserId: userActor.id })).toBe(true);

    // Lead sees own dept or report
    expect(can(leadActor, "view_employee_profile", { targetDepartmentId: "dept-eng" })).toBe(true);
    expect(can(leadActor, "view_employee_profile", { targetDepartmentId: "dept-prd" })).toBe(false);

    // User cannot view profiles
    expect(can(userActor, "view_employee_profile", { targetUserId: externalUserActor.id })).toBe(false);
  });

  // 3. Create bonus
  it("3. Create bonus", () => {
    expect(can(adminActor, "create_bonus")).toBe(true);
    expect(can(leadActor, "create_bonus")).toBe(true);
    expect(can(userActor, "create_bonus")).toBe(false);
  });

  // 4. Approve / reject / mark paid bonus
  it("4. Approve / reject / mark paid bonus", () => {
    expect(can(adminActor, "approve_bonus")).toBe(true);
    expect(can(leadActor, "approve_bonus")).toBe(false);
    expect(can(userActor, "approve_bonus")).toBe(false);
  });

  // 5. Edit bonus after approval
  it("5. Edit bonus after approval", () => {
    expect(can(adminActor, "edit_bonus_after_approval")).toBe(true);
    expect(can(leadActor, "edit_bonus_after_approval")).toBe(false);
    expect(can(userActor, "edit_bonus_after_approval")).toBe(false);
  });

  // 6. See DRAFT / PENDING / REJECTED bonus of others
  it("6. See DRAFT / PENDING / REJECTED bonus of others", () => {
    expect(can(adminActor, "view_unapproved_bonus_of_others", { targetDepartmentId: "dept-prd" })).toBe(true);
    expect(can(leadActor, "view_unapproved_bonus_of_others", { targetDepartmentId: "dept-eng" })).toBe(true);
    expect(can(leadActor, "view_unapproved_bonus_of_others", { targetDepartmentId: "dept-prd" })).toBe(false);
    expect(can(userActor, "view_unapproved_bonus_of_others", { targetDepartmentId: "dept-eng" })).toBe(false);
  });

  // 7. Write / submit review
  it("7. Write / submit review", () => {
    expect(can(adminActor, "write_review")).toBe(true);
    expect(can(leadActor, "write_review", { targetDepartmentId: "dept-eng" })).toBe(true);
    expect(can(leadActor, "write_review", { targetDepartmentId: "dept-prd" })).toBe(false);
    expect(can(userActor, "write_review")).toBe(false);
  });

  // 8. Acknowledge own review
  it("8. Acknowledge own review", () => {
    expect(can(adminActor, "acknowledge_review", { targetUserId: adminActor.id })).toBe(true);
    expect(can(leadActor, "acknowledge_review", { targetUserId: leadActor.id })).toBe(true);
    expect(can(userActor, "acknowledge_review", { targetUserId: userActor.id })).toBe(true);
    expect(can(userActor, "acknowledge_review", { targetUserId: externalUserActor.id })).toBe(false);
  });

  // 9. Edit a submitted review
  it("9. Edit a submitted review", () => {
    expect(can(adminActor, "edit_submitted_review")).toBe(true);
    // Lead can edit before acknowledgement
    expect(can(leadActor, "edit_submitted_review", { targetDepartmentId: "dept-eng", isAcknowledged: false })).toBe(true);
    // Lead cannot edit after acknowledgement
    expect(can(leadActor, "edit_submitted_review", { targetDepartmentId: "dept-eng", isAcknowledged: true })).toBe(false);
    // User cannot edit review
    expect(can(userActor, "edit_submitted_review")).toBe(false);
  });

  // 10. Raise escalation against an employee
  it("10. Raise escalation against an employee", () => {
    expect(can(adminActor, "raise_escalation_against_employee")).toBe(true);
    expect(can(leadActor, "raise_escalation_against_employee")).toBe(true);
    expect(can(userActor, "raise_escalation_against_employee")).toBe(false);
  });

  // 11. Raise complaint / grievance
  it("11. Raise complaint / grievance", () => {
    expect(can(adminActor, "raise_complaint")).toBe(true);
    expect(can(leadActor, "raise_complaint")).toBe(true);
    expect(can(userActor, "raise_complaint")).toBe(true);
  });

  // 12. Comment (internal) on escalation
  it("12. Comment (internal) on escalation", () => {
    expect(can(adminActor, "comment_internal_escalation")).toBe(true);
    expect(can(leadActor, "comment_internal_escalation")).toBe(true);
    expect(can(userActor, "comment_internal_escalation")).toBe(false);
  });

  // 13. Comment (shared) on escalation
  it("13. Comment (shared) on escalation", () => {
    expect(can(adminActor, "comment_shared_escalation")).toBe(true);
    expect(can(leadActor, "comment_shared_escalation", { targetDepartmentId: "dept-eng" })).toBe(true);
    expect(can(userActor, "comment_shared_escalation", { targetUserId: userActor.id })).toBe(true);
    expect(can(userActor, "comment_shared_escalation", { targetUserId: externalUserActor.id })).toBe(false);
  });

  // 14. Change escalation status
  it("14. Change escalation status", () => {
    expect(can(adminActor, "change_escalation_status")).toBe(true);
    expect(can(leadActor, "change_escalation_status", { targetDepartmentId: "dept-eng" })).toBe(true);
    // User can only withdraw own open escalation
    expect(can(userActor, "change_escalation_status", { targetUserId: userActor.id, status: "OPEN" })).toBe(true);
    expect(can(userActor, "change_escalation_status", { targetUserId: userActor.id, status: "CLOSED" })).toBe(false);
    expect(can(userActor, "change_escalation_status", { targetUserId: externalUserActor.id })).toBe(false);
  });

  // 15. View confidential escalations
  it("15. View confidential escalations", () => {
    expect(can(adminActor, "view_confidential_escalations")).toBe(true);
    expect(can(leadActor, "view_confidential_escalations", { targetDepartmentId: "dept-eng" })).toBe(false);
    expect(can(userActor, "view_confidential_escalations", { targetUserId: userActor.id })).toBe(true);
    expect(can(userActor, "view_confidential_escalations", { targetUserId: externalUserActor.id })).toBe(false);
  });

  // 16. View identity behind anonymous complaint
  it("16. View identity behind anonymous complaint", () => {
    expect(can(adminActor, "view_anonymous_complaint_author")).toBe(true);
    expect(can(leadActor, "view_anonymous_complaint_author")).toBe(false);
    expect(can(userActor, "view_anonymous_complaint_author")).toBe(false);
  });

  // 17. View audit log
  it("17. View audit log", () => {
    expect(can(adminActor, "view_audit_log")).toBe(true);
    expect(can(leadActor, "view_audit_log")).toBe(false);
    expect(can(userActor, "view_audit_log")).toBe(false);
  });

  // 18. User & role management
  it("18. User & role management", () => {
    expect(can(adminActor, "manage_users_roles")).toBe(true);
    expect(can(leadActor, "manage_users_roles")).toBe(false);
    expect(can(userActor, "manage_users_roles")).toBe(false);
  });

  // 19. App settings
  it("19. App settings", () => {
    expect(can(adminActor, "manage_app_settings")).toBe(true);
    expect(can(leadActor, "manage_app_settings")).toBe(false);
    expect(can(userActor, "manage_app_settings")).toBe(false);
  });

  // 20. Export CSV
  it("20. Export CSV", () => {
    expect(can(adminActor, "export_csv")).toBe(true);
    expect(can(leadActor, "export_csv")).toBe(true);
    expect(can(userActor, "export_csv", { targetUserId: userActor.id })).toBe(true);
  });
});
