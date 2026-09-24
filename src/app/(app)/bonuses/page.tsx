import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";
import { bonusRepo } from "@/server/repos/bonus.repo";
import { userRepo } from "@/server/repos/user.repo";
import { BonusesClient } from "./BonusesClient";

interface BonusesPageProps {
  searchParams: Promise<{
    status?: string;
    bonusType?: string;
    search?: string;
    action?: string;
    employeeId?: string;
    page?: string;
  }>;
}

export default async function BonusesPage({ searchParams }: BonusesPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user as unknown as SessionUser;
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const result = await bonusRepo.list(user, {
    status: params.status,
    bonusType: params.bonusType,
    search: params.search,
    page,
    pageSize: 25,
  });

  // Fetch employees for create modal if management
  let employeesList: Array<{ id: string; fullName: string; employeeCode: string; departmentName?: string | null }> = [];
  if (user.role === "ADMIN" || user.role === "LEAD") {
    const rawUsers = await userRepo.list(user, { pageSize: 100 });
    employeesList = rawUsers.rows.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      employeeCode: u.employeeCode,
      departmentName: u.departmentName,
    }));
  }

  return (
    <BonusesClient
      user={user}
      bonusesData={result.data}
      summary={result.summary}
      employees={employeesList}
      filters={{
        status: params.status || "",
        bonusType: params.bonusType || "",
        search: params.search || "",
      }}
      initialAction={params.action}
      preselectedEmployeeId={params.employeeId}
    />
  );
}
