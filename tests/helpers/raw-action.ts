import type { SessionUser, Role } from "@/types";

/**
 * Creates a mock session user context for direct adversarial invocation of server actions
 */
export function createMockActor(role: Role, overrides: Partial<SessionUser> = {}): SessionUser {
  const id = overrides.id || `mock-${role.toLowerCase()}-${Date.now()}`;
  return {
    id,
    email: overrides.email || `${role.toLowerCase()}@pulse.local`,
    fullName: overrides.fullName || `Mock ${role} User`,
    role,
    departmentId: overrides.departmentId !== undefined ? overrides.departmentId : "dept-eng-1",
    employeeCode: overrides.employeeCode || `EMP-${role.substring(0, 3)}`,
    avatarUrl: overrides.avatarUrl || null,
    mustChangePassword: overrides.mustChangePassword || false,
    ...overrides,
  };
}
