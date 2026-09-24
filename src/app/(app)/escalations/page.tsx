import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";
import { escalationRepo } from "@/server/repos/escalation.repo";
import { EscalationsClient } from "./EscalationsClient";

interface EscalationsPageProps {
  searchParams: Promise<{
    status?: string;
    severity?: string;
    category?: string;
    origin?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function EscalationsPage({ searchParams }: EscalationsPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user as unknown as SessionUser;
  const params = await searchParams;

  const page = params.page ? parseInt(params.page, 10) : 1;

  const escalationsData = await escalationRepo.list(user, {
    status: params.status,
    severity: params.severity,
    category: params.category,
    origin: params.origin,
    search: params.search,
    page,
    pageSize: 25,
  });

  return (
    <div className="space-y-6">
      <EscalationsClient
        user={user}
        data={escalationsData}
        currentFilters={{
          status: params.status || "",
          severity: params.severity || "",
          category: params.category || "",
          origin: params.origin || "",
          search: params.search || "",
          page,
        }}
      />
    </div>
  );
}
