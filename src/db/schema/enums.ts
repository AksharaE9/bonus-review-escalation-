import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role_enum", ["ADMIN", "LEAD", "USER"]);

export const userStatusEnum = pgEnum("user_status_enum", [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
]);

export const bonusTypeEnum = pgEnum("bonus_type_enum", [
  "PERFORMANCE",
  "SPOT",
  "REFERRAL",
  "FESTIVE",
  "RETENTION",
  "PROJECT",
  "MILESTONE",
  "OTHER",
]);

export const bonusStatusEnum = pgEnum("bonus_status_enum", [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "PAID",
  "CANCELLED",
]);

export const reviewTypeEnum = pgEnum("review_type_enum", [
  "MONTHLY",
  "QUARTERLY",
  "HALF_YEARLY",
  "ANNUAL",
  "PROBATION",
  "PROJECT",
  "PIP",
  "ADHOC",
]);

export const reviewStatusEnum = pgEnum("review_status_enum", [
  "DRAFT",
  "SUBMITTED",
  "ACKNOWLEDGED",
  "CLOSED",
]);

export const escOriginEnum = pgEnum("esc_origin_enum", [
  "MANAGEMENT",
  "EMPLOYEE",
]);

export const escCategoryEnum = pgEnum("esc_category_enum", [
  "PERFORMANCE",
  "ATTENDANCE",
  "BEHAVIOUR",
  "POLICY_VIOLATION",
  "CLIENT_COMPLAINT",
  "PAYROLL",
  "WORKPLACE",
  "IT_ASSET",
  "INTERPERSONAL",
  "OTHER",
]);

export const escSeverityEnum = pgEnum("esc_severity_enum", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const escStatusEnum = pgEnum("esc_status_enum", [
  "OPEN",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "AWAITING_EMPLOYEE",
  "RESOLVED",
  "CLOSED",
  "WITHDRAWN",
]);

export const auditActionEnum = pgEnum("audit_action_enum", [
  "CREATE",
  "UPDATE",
  "STATUS_CHANGE",
  "SOFT_DELETE",
  "RESTORE",
  "ROLE_CHANGE",
  "LOGIN",
  "LOGIN_FAILED",
  "LOGOUT",
  "EXPORT",
  "VIEW_CONFIDENTIAL",
  "PASSWORD_RESET",
]);

export const visibilityEnum = pgEnum("visibility_enum", [
  "INTERNAL",
  "SHARED",
]);
