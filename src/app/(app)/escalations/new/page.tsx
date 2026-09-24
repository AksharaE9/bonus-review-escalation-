import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";
import { userRepo } from "@/server/repos/user.repo";
import { ComplaintIntakeClient } from "./ComplaintIntakeClient";

interface ComplaintIntakePageProps {
  searchParams: Promise<{ employeeId?: string; origin?: string }>;
}

export default async function ComplaintIntakePage({ searchParams }: ComplaintIntakePageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user as unknown as SessionUser;
  const { employeeId, origin } = await searchParams;

  // Fetch employee list for selection (if management or if user wants to tag a person)
  let employees: Array<{ id: string; fullName: string; employeeCode: string; departmentName: string | null }> = [];
  if (user.role !== "USER") {
    const usersData = await userRepo.list(user, { pageSize: 100 });
    employees = usersData.rows.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      employeeCode: u.employeeCode,
      departmentName: u.departmentName ?? null,
    }));
  } else {
    // For users, fetch active employees for the optional "Concerns specific person" field
    const usersData = await userRepo.list(user, { pageSize: 100 });
    employees = usersData.rows.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      employeeCode: u.employeeCode,
      departmentName: u.departmentName ?? null,
    }));
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <ComplaintIntakeClient
        user={user}
        employees={employees}
        preselectedEmployeeId={employeeId}
        initialOrigin={origin === "MANAGEMENT" ? "MANAGEMENT" : "EMPLOYEE"}
      />
    </div>
  );
}
