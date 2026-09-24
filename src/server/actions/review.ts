"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";
import { reviewService } from "@/server/services/review.service";
import {
  SaveReviewSchema,
  AcknowledgeReviewSchema,
  type SaveReviewInput,
  type AcknowledgeReviewInput,
} from "@/lib/validators/review";

async function getAuditContext(actor: SessionUser) {
  const headerList = await headers();
  return {
    actor,
    ipAddress: headerList.get("x-forwarded-for") || headerList.get("x-real-ip") || "127.0.0.1",
    userAgent: headerList.get("user-agent") || "PulseApp",
    requestId: headerList.get("x-request-id") || crypto.randomUUID(),
  };
}

export async function saveReviewAction(rawInput: SaveReviewInput) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required." };
  }

  const actor = session.user as unknown as SessionUser;
  const parseRes = SaveReviewSchema.safeParse(rawInput);
  if (!parseRes.success) {
    return { success: false, error: parseRes.error.errors[0]?.message || "Validation failed" };
  }

  try {
    const auditCtx = await getAuditContext(actor);
    const result = await reviewService.saveReview(actor, parseRes.data, auditCtx);
    revalidatePath("/reviews");
    revalidatePath(`/employees/${parseRes.data.employeeId}`);
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function acknowledgeReviewAction(rawInput: AcknowledgeReviewInput) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required." };
  }

  const actor = session.user as unknown as SessionUser;
  const parseRes = AcknowledgeReviewSchema.safeParse(rawInput);
  if (!parseRes.success) {
    return { success: false, error: parseRes.error.errors[0]?.message || "Validation failed" };
  }

  try {
    const auditCtx = await getAuditContext(actor);
    const result = await reviewService.acknowledgeReview(actor, parseRes.data, auditCtx);
    revalidatePath("/reviews");
    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}
