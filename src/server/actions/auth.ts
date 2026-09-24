"use server";

import { headers } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { auditLogs } from "@/db/schema/audit";
import { eq, and, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { withAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import type { SessionUser, Role } from "@/types";

// Constant dummy hash for constant-time comparison on nonexistent user lookups
const DUMMY_HASH = "$2a$10$e7Z8P0H8W5LzN1n2v8s4e.uNOPQRSTUVWXYZabcdefghijklmnopqr";

export async function loginAction(formData: FormData) {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") || headerList.get("x-real-ip") || "127.0.0.1";
  const userAgent = headerList.get("user-agent") || "PulseApp";
  const requestId = headerList.get("x-request-id") || crypto.randomUUID();

  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  // Rate Limiting: 5 attempts per 15 min per IP+email
  const rlKey = `login_${ip}_${email}`;
  const rl = rateLimit(rlKey, 5, 15 * 60 * 1000);

  if (!rl.success) {
    return {
      error: "Too many failed login attempts. Please wait 15 minutes before trying again.",
    };
  }

  try {
    // 1. Fetch user to verify credentials
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      // Execute dummy comparison to equalize execution timing (anti-enumeration)
      await bcrypt.compare(password, DUMMY_HASH);

      // Audit log failed attempt
      await db.insert(auditLogs).values({
        actorId: null,
        actorEmail: email,
        actorRole: null,
        action: "LOGIN_FAILED",
        entityType: "users",
        entityId: null,
        entityLabel: `Failed login attempt for nonexistent ${email}`,
        ipAddress: ip,
        userAgent,
        requestId,
      });

      return { error: "Invalid email or password." };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      // Audit log failed attempt
      await db.insert(auditLogs).values({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role as Role,
        action: "LOGIN_FAILED",
        entityType: "users",
        entityId: user.id,
        entityLabel: `Failed password for ${email}`,
        ipAddress: ip,
        userAgent,
        requestId,
      });

      return { error: "Invalid email or password." };
    }

    if (user.status === "INACTIVE") {
      return {
        error: "Your account registration is pending administrator approval. You will receive access once approved.",
      };
    }

    if (user.status === "SUSPENDED") {
      return {
        error: "Your account has been suspended. Please contact human resources or your administrator.",
      };
    }

    if (!isValid) {
      // Audit log failed attempt
      await db.insert(auditLogs).values({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role as Role,
        action: "LOGIN_FAILED",
        entityType: "users",
        entityId: user.id,
        entityLabel: `Failed password for ${email}`,
        ipAddress: ip,
        userAgent,
        requestId,
      });

      return { error: "Invalid email or password." };
    }

    // Clear failed attempts counter on successful verification
    resetRateLimit(rlKey);

    // Record login timestamp and audit success
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    await db.insert(auditLogs).values({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role as Role,
      action: "LOGIN",
      entityType: "users",
      entityId: user.id,
      entityLabel: `Successful login by ${user.fullName}`,
      ipAddress: ip,
      userAgent,
      requestId,
    });

    return {
      success: true,
      mustChangePassword: user.mustChangePassword,
    };
  } catch (err: unknown) {
    return { error: (err as Error).message || "Authentication error." };
  }
}

export async function changePasswordAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const actor = session.user as unknown as SessionUser;
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!newPassword || newPassword.length < 8) {
    return { error: "New password must be at least 8 characters long." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, actor.id))
    .limit(1);

  if (!user) {
    return { error: "User not found." };
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    return { error: "Current password is incorrect." };
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  await withAudit<typeof users.$inferSelect>(
    { actor },
    () => ({
      action: "PASSWORD_RESET",
      entityType: "users",
      entityId: user.id,
      entityLabel: `Password updated for ${user.fullName}`,
      after: { mustChangePassword: false },
    }),
    async (tx) => {
      const [updated] = await tx
        .update(users)
        .set({
          passwordHash: newHash,
          mustChangePassword: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning();

      return updated;
    }
  );

  return { success: true };
}
