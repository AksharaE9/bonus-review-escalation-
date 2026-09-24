export type Role = "ADMIN" | "LEAD" | "USER";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type BonusType =
  | "PERFORMANCE"
  | "SPOT"
  | "REFERRAL"
  | "FESTIVE"
  | "RETENTION"
  | "PROJECT"
  | "MILESTONE"
  | "OTHER";
export type BonusStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "PAID"
  | "CANCELLED";
export type ReviewType =
  | "MONTHLY"
  | "QUARTERLY"
  | "HALF_YEARLY"
  | "ANNUAL"
  | "PROBATION"
  | "PROJECT"
  | "PIP"
  | "ADHOC";
export type ReviewStatus = "DRAFT" | "SUBMITTED" | "ACKNOWLEDGED" | "CLOSED";
export type EscalationOrigin = "MANAGEMENT" | "EMPLOYEE";
export type EscalationCategory =
  | "PERFORMANCE"
  | "ATTENDANCE"
  | "BEHAVIOUR"
  | "POLICY_VIOLATION"
  | "CLIENT_COMPLAINT"
  | "PAYROLL"
  | "WORKPLACE"
  | "IT_ASSET"
  | "INTERPERSONAL"
  | "OTHER";
export type EscalationSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type EscalationStatus =
  | "OPEN"
  | "ACKNOWLEDGED"
  | "IN_PROGRESS"
  | "AWAITING_EMPLOYEE"
  | "RESOLVED"
  | "CLOSED"
  | "WITHDRAWN";
export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "STATUS_CHANGE"
  | "SOFT_DELETE"
  | "RESTORE"
  | "ROLE_CHANGE"
  | "LOGIN"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "EXPORT"
  | "VIEW_CONFIDENTIAL"
  | "PASSWORD_RESET";
export type Visibility = "INTERNAL" | "SHARED";

export interface SessionUser {
  id: string;
  employeeCode: string;
  email: string;
  fullName: string;
  role: Role;
  departmentId: string | null;
  avatarUrl?: string | null;
  mustChangePassword?: boolean;
}

export interface PublicUser {
  id: string;
  employeeCode: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: Role;
  departmentId: string | null;
  departmentName?: string | null;
  departmentCode?: string | null;
  managerId: string | null;
  managerName?: string | null;
  designation: string | null;
  dateOfJoining: string | null;
  phone: string | null;
  status: UserStatus;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PaginatedResult<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
