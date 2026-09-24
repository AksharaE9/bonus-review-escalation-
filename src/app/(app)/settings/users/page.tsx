import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { departments } from "@/db/schema/departments";
import { eq, isNull, desc } from "drizzle-orm";
import { UsersClient } from "./UsersClient";

export default async function UsersManagementPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user as unknown as SessionUser;
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const allUsers = await db
    .select({
      id: users.id,
      employeeCode: users.employeeCode,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      departmentId: users.departmentId,
      departmentName: departments.name,
      designation: users.designation,
      status: users.status,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .where(isNull(users.deletedAt))
    .orderBy(desc(users.createdAt));

  const allDepartments = await db.select().from(departments);

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      <UsersClient
        currentUser={user}
        users={allUsers.map((u) => ({
          ...u,
          lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : null,
          createdAt: new Date(u.createdAt).toISOString(),
        }))}
        departments={allDepartments}
      />
    </div>
  );
}
