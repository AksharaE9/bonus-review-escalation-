import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";
import { userRepo } from "@/server/repos/user.repo";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { competencies, reviewCycles } from "@/db/schema/reviews";
import { ReviewComposerClient } from "./ReviewComposerClient";

interface NewReviewPageProps {
  searchParams: Promise<{ employeeId?: string }>;
}

export default async function NewReviewPage({ searchParams }: NewReviewPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user as unknown as SessionUser;

  if (user.role === "USER") {
    redirect("/dashboard");
  }

  const { employeeId } = await searchParams;

  // 1. Fetch available employees within lead/admin scope
  const usersData = await userRepo.list(user, { pageSize: 100 });
  const employees = usersData.rows.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    employeeCode: u.employeeCode,
    departmentName: u.departmentName,
  }));

  // 2. Fetch active competencies
  const activeCompetencies = await db
    .select({
      id: competencies.id,
      name: competencies.name,
      description: competencies.description,
      weight: competencies.weight,
      sortOrder: competencies.sortOrder,
    })
    .from(competencies)
    .where(eq(competencies.isActive, true))
    .orderBy(competencies.sortOrder);

  // 3. Fetch review cycles
  const cycles = await db
    .select({
      id: reviewCycles.id,
      name: reviewCycles.name,
      reviewType: reviewCycles.reviewType,
      startDate: reviewCycles.startDate,
      endDate: reviewCycles.endDate,
    })
    .from(reviewCycles)
    .where(eq(reviewCycles.isOpen, true));

  return (
    <ReviewComposerClient
      user={user}
      employees={employees}
      competencies={activeCompetencies}
      cycles={cycles}
      preselectedEmployeeId={employeeId}
    />
  );
}
