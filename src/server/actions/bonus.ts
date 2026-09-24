"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";
import { bonusService } from "@/server/services/bonus.service";
import {
  CreateBonusSchema,
  RejectBonusSchema,
  MarkPaidBonusSchema,
  BulkApproveBonusesSchema,
  type CreateBonusInput,
  type RejectBonusInput,
  type MarkPaidBonusInput,
} from "@/lib/validators/bonus";

async function getAuditContext(actor: SessionUser) {
  const headerList = await headers();
  return {
    actor,
    ipAddress: headerList.get("x-forwarded-for") || headerList.get("x-real-ip") || "127.0.0.1",
    userAgent: headerList.get("user-agent") || "PulseApp",
    requestId: headerList.get("x-request-id") || crypto.randomUUID(),
  };
}

export async function createBonusAction(rawInput: CreateBonusInput) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required." };
  }

  const actor = session.user as unknown as SessionUser;
  const parseRes = CreateBonusSchema.safeParse(rawInput);
  if (!parseRes.success) {
    return { success: false, error: parseRes.error.errors[0]?.message || "Validation failed" };
  }

  try {
    const auditCtx = await getAuditContext(actor);
    const result = await bonusService.createBonus(actor, parseRes.data, auditCtx);
    revalidatePath("/bonuses");
    revalidatePath(`/employees/${parseRes.data.employeeId}`);
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function approveBonusAction(bonusId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required." };
  }

  const actor = session.user as unknown as SessionUser;

  try {
    const auditCtx = await getAuditContext(actor);
    const result = await bonusService.approveBonus(actor, bonusId, auditCtx);
    revalidatePath("/bonuses");
    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function rejectBonusAction(rawInput: RejectBonusInput) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required." };
  }

  const actor = session.user as unknown as SessionUser;
  const parseRes = RejectBonusSchema.safeParse(rawInput);
  if (!parseRes.success) {
    return { success: false, error: parseRes.error.errors[0]?.message || "Validation failed" };
  }

  try {
    const auditCtx = await getAuditContext(actor);
    const result = await bonusService.rejectBonus(actor, parseRes.data, auditCtx);
    revalidatePath("/bonuses");
    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function markPaidBonusAction(rawInput: MarkPaidBonusInput) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required." };
  }

  const actor = session.user as unknown as SessionUser;
  const parseRes = MarkPaidBonusSchema.safeParse(rawInput);
  if (!parseRes.success) {
    return { success: false, error: parseRes.error.errors[0]?.message || "Validation failed" };
  }

  try {
    const auditCtx = await getAuditContext(actor);
    const result = await bonusService.markPaid(actor, parseRes.data, auditCtx);
    revalidatePath("/bonuses");
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function bulkApproveBonusesAction(bonusIds: string[]) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required." };
  }

  const actor = session.user as unknown as SessionUser;
  const parseRes = BulkApproveBonusesSchema.safeParse({ bonusIds });
  if (!parseRes.success) {
    return { success: false, error: parseRes.error.errors[0]?.message || "Validation failed" };
  }

  try {
    const auditCtx = await getAuditContext(actor);
    const result = await bonusService.bulkApprove(actor, parseRes.data.bonusIds, auditCtx);
    revalidatePath("/bonuses");
    revalidatePath("/dashboard");
    return { success: true, count: result.length };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}
