"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn, signOut, auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { auditLogs } from "@/db/schema/audit";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { withAudit } from "@/lib/audit";
import { getSafeCallbackUrl } from "@/lib/auth-routes";
import type { SessionUser } from "@/types";

const signInSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  callbackUrl: z.string().optional(),
});

export interface SignInActionState {
  error?: string;
}

export async function signInAction(
  prevState: SignInActionState | null | undefined,
  formData: FormData
): Promise<SignInActionState> {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") || headerList.get("x-real-ip") || "127.0.0.1";
  const userAgent = headerList.get("user-agent") || "PulseApp";
  const requestId = headerList.get("x-request-id") || crypto.randomUUID();

  const rawEmail = String(formData.get("email") || "");
  const rawPassword = String(formData.get("password") || "");
  const rawCallbackUrl = String(formData.get("callbackUrl") || "");

  const parsed = signInSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
    callbackUrl: rawCallbackUrl,
  });

  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  const { email, password, callbackUrl } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Rate Limiting: 5 attempts per 15 min per IP+email
  const rlKey = `login_${ip}_${normalizedEmail}`;
  const rl = rateLimit(rlKey, 5, 15 * 60 * 1000);

  if (!rl.success) {
    return {
      error: "Too many failed login attempts. Please wait 15 minutes before trying again.",
    };
  }

  const safeRedirectTo = getSafeCallbackUrl(callbackUrl || "/dashboard");

  try {
    await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirectTo: safeRedirectTo,
    });

    // Reset rate limit on success
    resetRateLimit(rlKey);

    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      // Audit log failed login
      try {
        await db.insert(auditLogs).values({
          actorId: null,
          actorEmail: normalizedEmail,
          actorRole: null,
          action: "LOGIN_FAILED",
          entityType: "users",
          entityId: null,
          entityLabel: `Failed login attempt for ${normalizedEmail}`,
          ipAddress: ip,
          userAgent,
          requestId,
        });
      } catch (auditErr) {
        console.error("Failed to write audit log:", auditErr);
      }

      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        default:
          return { error: "Unable to sign in. Please try again." };
      }
    }

    // MANDATORY: Re-throw NEXT_REDIRECT to allow Next.js server-driven navigation to propagate.
    // If caught and converted to a return value, navigation silently fails.
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/sign-in" });
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
          sessionVersion: sql`${users.sessionVersion} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning();

      return updated;
    }
  );

  return { success: true };
}
