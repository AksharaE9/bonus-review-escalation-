import React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";
import { escalationRepo } from "@/server/repos/escalation.repo";
import { userRepo } from "@/server/repos/user.repo";
import { EscalationDetailClient } from "./EscalationDetailClient";

interface EscalationDetailPageProps {
  params: Promise<{ refCode: string }>;
}

export default async function EscalationDetailPage({ params }: EscalationDetailPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user as unknown as SessionUser;
  const { refCode } = await params;

  const escalation = await escalationRepo.findByRefCode(user, refCode);

  if (!escalation) {
    notFound();
  }

  // If subject employee is present, fetch their details for the right rail
  let subjectEmployee = null;
  if (escalation.subjectEmployeeId) {
    const res = await userRepo.findById(user, escalation.subjectEmployeeId);
    if (res) {
      subjectEmployee = {
        id: res.id,
        fullName: res.fullName,
        employeeCode: res.employeeCode,
        departmentName: res.departmentName ?? null,
        designation: res.designation,
        avatarUrl: res.avatarUrl,
      };
    }
  }

  // Fetch management users for assignment if user is Admin/Lead
  let assignableUsers: Array<{ id: string; fullName: string; role: string }> = [];
  if (user.role !== "USER") {
    const leadsAndAdmins = await userRepo.list(user, { pageSize: 50 });
    assignableUsers = leadsAndAdmins.rows
      .filter((u) => u.role !== "USER")
      .map((u) => ({ id: u.id, fullName: u.fullName, role: u.role }));
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <EscalationDetailClient
        user={user}
        escalation={escalation}
        subjectEmployee={subjectEmployee}
        assignableUsers={assignableUsers}
      />
    </div>
  );
}
