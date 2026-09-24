import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser, AuditAction } from "@/types";
import { auditRepo } from "@/server/repos/audit.repo";
import { AuditClient } from "./AuditClient";

interface AuditPageProps {
  searchParams: Promise<{
    cursorId?: string;
    action?: string;
    entityType?: string;
    search?: string;
  }>;
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user as unknown as SessionUser;

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const resolvedParams = await searchParams;
  const cursorId = resolvedParams.cursorId ? parseInt(resolvedParams.cursorId, 10) : undefined;
  const action = resolvedParams.action as AuditAction | undefined;
  const entityType = resolvedParams.entityType;
  const search = resolvedParams.search;

  const data = await auditRepo.list(user, {
    cursorId,
    action,
    entityType,
    search,
    limit: 50,
  });

  return (
    <AuditClient
      initialData={data}
      currentFilters={{
        action: action || "",
        entityType: entityType || "",
        search: search || "",
      }}
    />
  );
}
