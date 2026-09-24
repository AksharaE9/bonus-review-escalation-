"use server";

import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";
import { escalationService } from "@/server/services/escalation.service";
import {
  CreateEscalationInput,
  UpdateEscalationStatusInput,
  AddEscalationCommentInput,
} from "@/lib/validators/escalation";
import { revalidatePath } from "next/cache";

async function getActor(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user as unknown as SessionUser;
}

export async function createEscalationAction(input: CreateEscalationInput) {
  const actor = await getActor();
  const created = await escalationService.create(actor, input);
  revalidatePath("/escalations");
  revalidatePath("/dashboard");
  if (input.subjectEmployeeId) {
    revalidatePath(`/employees/${input.subjectEmployeeId}`);
  }
  return { success: true, data: created };
}

export async function updateEscalationStatusAction(
  refCode: string,
  input: UpdateEscalationStatusInput
) {
  const actor = await getActor();
  const updated = await escalationService.updateStatus(actor, refCode, input);
  revalidatePath(`/escalations/${refCode}`);
  revalidatePath("/escalations");
  revalidatePath("/dashboard");
  return { success: true, data: updated };
}

export async function addEscalationCommentAction(input: AddEscalationCommentInput) {
  const actor = await getActor();
  const comment = await escalationService.addComment(actor, input);
  revalidatePath("/escalations");
  return { success: true, data: comment };
}

export async function assignEscalationAction(
  escalationId: string,
  assignedToUserId: string | null
) {
  const actor = await getActor();
  const updated = await escalationService.assign(actor, escalationId, assignedToUserId);
  revalidatePath("/escalations");
  return { success: true, data: updated };
}
