import type { SessionUser } from "@/types";

export type RbacAction =
  | "view_own_records"
  | "view_employee_profile"
  | "create_bonus"
  | "approve_bonus"
  | "edit_bonus_after_approval"
  | "view_unapproved_bonus_of_others"
  | "write_review"
  | "acknowledge_review"
  | "edit_submitted_review"
  | "raise_escalation_against_employee"
  | "raise_complaint"
  | "comment_internal_escalation"
  | "comment_shared_escalation"
  | "change_escalation_status"
  | "view_confidential_escalations"
  | "view_anonymous_complaint_author"
  | "view_audit_log"
  | "manage_users_roles"
  | "manage_app_settings"
  | "export_csv";

export interface RbacResourceContext {
  targetUserId?: string | null;
  targetDepartmentId?: string | null;
  targetManagerId?: string | null;
  isOwner?: boolean;
  status?: string | null;
  isAcknowledged?: boolean;
  isConfidential?: boolean;
  isAnonymous?: boolean;
}

/**
 * Authoritative RBAC Capability Evaluator
 * Evaluates whether an authenticated actor has permission to perform an action on a given resource context.
 */
export function can(
  actor: Pick<SessionUser, "id" | "role" | "departmentId"> | null | undefined,
  action: RbacAction,
  context?: RbacResourceContext
): boolean {
  if (!actor) return false;

  const { role, id: actorId, departmentId: actorDeptId } = actor;

  // Contextual helpers
  const isSelf = context?.targetUserId ? context.targetUserId === actorId : context?.isOwner ?? false;
  const isSameDept = context?.targetDepartmentId && actorDeptId ? context.targetDepartmentId === actorDeptId : false;
  const isReport = context?.targetManagerId ? context.targetManagerId === actorId : false;
  const isLeadScope = isSameDept || isReport || isSelf;

  switch (action) {
    case "view_own_records":
      // All roles can view their own bonus/review/escalation records
      return true;

    case "view_employee_profile":
      if (role === "ADMIN") return true;
      if (role === "LEAD") return isLeadScope;
      return false; // USER cannot view directory or other employee profiles

    case "create_bonus":
      if (role === "ADMIN") return true;
      if (role === "LEAD") return true; // Lead creates bonus (status: PENDING_APPROVAL)
      return false; // USER cannot create bonuses

    case "approve_bonus":
      return role === "ADMIN";

    case "edit_bonus_after_approval":
      return role === "ADMIN";

    case "view_unapproved_bonus_of_others":
      if (role === "ADMIN") return true;
      if (role === "LEAD") return isLeadScope;
      return false; // USER never sees DRAFT / PENDING / REJECTED bonuses of others

    case "write_review":
      if (role === "ADMIN") return true;
      if (role === "LEAD") return isLeadScope;
      return false;

    case "acknowledge_review":
      // Any employee can acknowledge their own review
      return isSelf;

    case "edit_submitted_review":
      if (role === "ADMIN") return true;
      if (role === "LEAD") {
        // Lead can edit before employee acknowledgement
        return isLeadScope && !context?.isAcknowledged;
      }
      return false;

    case "raise_escalation_against_employee":
      if (role === "ADMIN") return true;
      if (role === "LEAD") return true;
      return false;

    case "raise_complaint":
      // All authenticated roles can raise a grievance/complaint
      return true;

    case "comment_internal_escalation":
      if (role === "ADMIN") return true;
      if (role === "LEAD") return true;
      return false; // USER cannot see or write internal comments

    case "comment_shared_escalation":
      if (role === "ADMIN") return true;
      if (role === "LEAD") return isLeadScope;
      return isSelf; // USER can comment on escalations they raised or concern them

    case "change_escalation_status":
      if (role === "ADMIN") return true;
      if (role === "LEAD") return isLeadScope;
      if (role === "USER") {
        // User can only withdraw their own complaint
        return isSelf && context?.status !== "CLOSED";
      }
      return false;

    case "view_confidential_escalations":
      if (role === "ADMIN") return true;
      if (role === "LEAD") return false; // Lead cannot view confidential escalations
      return isSelf; // User can view if they raised it

    case "view_anonymous_complaint_author":
      return role === "ADMIN"; // Only Admin sees identity behind anonymous complaints

    case "view_audit_log":
      return role === "ADMIN";

    case "manage_users_roles":
      return role === "ADMIN";

    case "manage_app_settings":
      return role === "ADMIN";

    case "export_csv":
      if (role === "ADMIN") return true;
      if (role === "LEAD") return true;
      return isSelf;

    default:
      return false;
  }
}
