"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { departments } from "@/db/schema/departments";
import { bonuses } from "@/db/schema/bonuses";
import { reviews } from "@/db/schema/reviews";
import { escalations } from "@/db/schema/escalations";
import { withAudit } from "@/lib/audit";
import { can } from "@/lib/rbac";
import { eq, and, isNull, sql, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { SessionUser, Role } from "@/types";

async function getAdminActor(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const actor = session.user as unknown as SessionUser;
  if (!can(actor, "manage_users_roles")) {
    throw new Error("Forbidden: Admin access required.");
  }
  return actor;
}

export interface CreateUserInput {
  email: string;
  fullName: string;
  role: Role;
  departmentId?: string | null;
  designation?: string | null;
  phone?: string | null;
  password?: string | null;
  managerId?: string | null;
  dateOfJoining?: string | null;
}

export async function createUserAction(input: CreateUserInput) {
  const actor = await getAdminActor();

  const email = input.email.toLowerCase().trim();
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    throw new Error("A user with this email address already exists.");
  }

  // Generate unique employee code
  const countRes = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users);
  const nextNum = (countRes[0]?.count ?? 0) + 1001;
  const employeeCode = `EMP-${nextNum}`;

  // Default or custom temporary password
  const tempPassword = input.password?.trim() || `Pulse@${nextNum}`;
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const newUser = await withAudit<typeof users.$inferSelect>(
    { actor },
    (u) => ({
      action: "CREATE",
      entityType: "users",
      entityId: u.id,
      entityLabel: `${u.fullName} (${u.employeeCode})`,
      after: {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        departmentId: u.departmentId,
      },
    }),
    async (tx) => {
      const [u] = await tx
        .insert(users)
        .values({
          employeeCode,
          email,
          passwordHash,
          fullName: input.fullName.trim(),
          role: input.role,
          departmentId: input.departmentId || null,
          managerId: input.managerId || null,
          designation: input.designation || null,
          phone: input.phone || null,
          dateOfJoining: input.dateOfJoining || null,
          status: "ACTIVE",
          mustChangePassword: !input.password,
        })
        .returning();

      return u;
    }
  );

  return {
    ...newUser,
    temporaryPassword: tempPassword,
  };
}

export async function updateUserRoleAction(userId: string, newRole: Role) {
  const actor = await getAdminActor();

  const [existing] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  if (!existing) {
    throw new Error("User not found");
  }

  return await withAudit<typeof users.$inferSelect>(
    { actor },
    (updated) => ({
      action: "ROLE_CHANGE",
      entityType: "users",
      entityId: existing.id,
      entityLabel: `Role change for ${existing.fullName}: ${existing.role} → ${newRole}`,
      before: { role: existing.role },
      after: { role: updated.role },
    }),
    async (tx) => {
      const [updated] = await tx
        .update(users)
        .set({ role: newRole, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();

      return updated;
    }
  );
}

export async function softDeleteUserAction(userId: string) {
  const actor = await getAdminActor();

  const [existing] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  if (!existing) {
    throw new Error("User not found");
  }

  return await withAudit<typeof users.$inferSelect>(
    { actor },
    (updated) => ({
      action: "SOFT_DELETE",
      entityType: "users",
      entityId: existing.id,
      entityLabel: `Deactivated user ${existing.fullName}`,
      before: existing as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
    }),
    async (tx) => {
      const [updated] = await tx
        .update(users)
        .set({
          deletedAt: new Date(),
          status: "INACTIVE",
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      return updated;
    }
  );
}

export async function restoreRecordAction(entityType: "users" | "bonuses" | "reviews" | "escalations", recordId: string) {
  const actor = await getAdminActor();

  return await withAudit<Record<string, unknown>>(
    { actor },
    () => ({
      action: "RESTORE",
      entityType,
      entityId: recordId,
      entityLabel: `Restored soft-deleted ${entityType} record`,
      after: { restoredAt: new Date() },
    }),
    async (tx) => {
      if (entityType === "users") {
        await tx.update(users).set({ deletedAt: null, status: "ACTIVE" }).where(eq(users.id, recordId));
      } else if (entityType === "bonuses") {
        await tx.update(bonuses).set({ deletedAt: null }).where(eq(bonuses.id, recordId));
      } else if (entityType === "reviews") {
        await tx.update(reviews).set({ deletedAt: null }).where(eq(reviews.id, recordId));
      } else if (entityType === "escalations") {
        await tx.update(escalations).set({ deletedAt: null }).where(eq(escalations.id, recordId));
      }
      return { restored: true };
    }
  );
}

export interface RegisterUserInput {
  email: string;
  fullName: string;
  password: string;
  departmentId?: string | null;
  designation?: string | null;
  phone?: string | null;
}

export async function registerUserAction(input: RegisterUserInput) {
  const email = input.email.toLowerCase().trim();
  const fullName = input.fullName.trim();
  const password = input.password;

  if (!email || !fullName || !password) {
    return { error: "Full Name, email, and password are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return { error: "An account with this email address already exists." };
  }

  // Generate sequential employee code
  const countRes = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users);
  const nextNum = (countRes[0]?.count ?? 0) + 1001;
  const employeeCode = `EMP-${nextNum}`;

  const passwordHash = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    employeeCode,
    email,
    passwordHash,
    fullName,
    role: "USER",
    departmentId: input.departmentId || null,
    designation: input.designation || null,
    phone: input.phone || null,
    status: "INACTIVE", // Pending Admin Approval
    mustChangePassword: false,
  });

  return {
    success: true,
    message: "Registration submitted successfully! Your administrator will review and activate your account.",
  };
}

export interface ApproveUserInput {
  userId: string;
  role: Role;
  departmentId?: string | null;
  designation?: string | null;
}

export async function approveUserAction(input: ApproveUserInput) {
  const actor = await getAdminActor();

  const [existing] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, input.userId), isNull(users.deletedAt)))
    .limit(1);

  if (!existing) {
    throw new Error("User not found");
  }

  return await withAudit<typeof users.$inferSelect>(
    { actor },
    (updated) => ({
      action: "STATUS_CHANGE",
      entityType: "users",
      entityId: existing.id,
      entityLabel: `Approved & activated member ${existing.fullName} (${input.role})`,
      before: { status: existing.status, role: existing.role, departmentId: existing.departmentId },
      after: { status: updated.status, role: updated.role, departmentId: updated.departmentId },
    }),
    async (tx) => {
      const [updated] = await tx
        .update(users)
        .set({
          status: "ACTIVE",
          role: input.role,
          departmentId: input.departmentId !== undefined ? input.departmentId : existing.departmentId,
          designation: input.designation !== undefined ? input.designation : existing.designation,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId))
        .returning();

      return updated;
    }
  );
}

export async function rejectUserAction(userId: string) {
  const actor = await getAdminActor();

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!existing) {
    throw new Error("User not found");
  }

  return await withAudit<Record<string, unknown>>(
    { actor },
    () => ({
      action: "SOFT_DELETE",
      entityType: "users",
      entityId: existing.id,
      entityLabel: `Rejected registration request for ${existing.fullName} (${existing.email})`,
      before: { email: existing.email, fullName: existing.fullName },
    }),
    async (tx) => {
      await tx.delete(users).where(eq(users.id, userId));
      return { rejected: true };
    }
  );
}

export async function getUsersRealtimeAction() {
  await getAdminActor();

  const allUsers = await db
    .select({
      id: users.id,
      employeeCode: users.employeeCode,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      departmentId: users.departmentId,
      departmentName: departments.name,
      designation: users.designation,
      status: users.status,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .where(isNull(users.deletedAt))
    .orderBy(desc(users.createdAt));

  const pendingCount = allUsers.filter((u) => u.status === "INACTIVE").length;
  const activeCount = allUsers.filter((u) => u.status === "ACTIVE").length;

  return {
    users: allUsers.map((u) => ({
      ...u,
      lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : null,
      createdAt: new Date(u.createdAt).toISOString(),
    })),
    pendingCount,
    activeCount,
    timestamp: new Date().toISOString(),
  };
}

export async function getPendingRegistrationsCountAction() {
  const session = await auth();
  if (!session?.user) return { count: 0 };
  const actor = session.user as unknown as SessionUser;
  if (actor.role !== "ADMIN") return { count: 0 };

  const [res] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(and(eq(users.status, "INACTIVE"), isNull(users.deletedAt)));

  return { count: res?.count ?? 0 };
}
