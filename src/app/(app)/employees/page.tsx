import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";
import { userRepo } from "@/server/repos/user.repo";
import { DirectoryClient } from "./DirectoryClient";

interface EmployeesPageProps {
  searchParams: Promise<{
    search?: string;
    departmentId?: string;
    role?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function EmployeesPage({ searchParams }: EmployeesPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user as unknown as SessionUser;

  // USER role cannot access employee directory
  if (user.role === "USER") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  // Fetch users within actor scope
  const usersData = await userRepo.list(user, {
    search: params.search,
    departmentId: params.departmentId,
    role: params.role,
    status: params.status,
    page,
    pageSize: 24,
  });

  // Fetch departments list for filter dropdown via userRepo
  const depts = await userRepo.getDepartments();

  return (
    <DirectoryClient
      user={user}
      usersData={usersData}
      departments={depts}
      filters={{
        search: params.search || "",
        departmentId: params.departmentId || "",
        role: params.role || "",
        status: params.status || "",
      }}
    />
  );
}
