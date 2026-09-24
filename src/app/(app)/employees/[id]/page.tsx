import React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";
import { employeeProfileRepo } from "@/server/repos/employee-profile.repo";
import { bonusRepo } from "@/server/repos/bonus.repo";
import { reviewRepo } from "@/server/repos/review.repo";
import { escalationRepo } from "@/server/repos/escalation.repo";
import { auditRepo } from "@/server/repos/audit.repo";
import { ProfileClient } from "./ProfileClient";

interface EmployeeProfilePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function EmployeeProfilePage({
  params,
  searchParams,
}: EmployeeProfilePageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const actor = session.user as unknown as SessionUser;
  const { id: employeeId } = await params;
  const { tab = "overview" } = await searchParams;

  // 1. Single consolidated query for header & stats
  const profileSummary = await employeeProfileRepo.getProfileHeaderAndStats(
    actor,
    employeeId
  );

  // Return 404 (do not leak existence) if unauthorized or not found
  if (!profileSummary) {
    notFound();
  }

  // 2. Fetch specific tab data lazily based on current tab
  let timelineItems: import("@/server/repos/employee-profile.repo").ActivityTimelineItem[] = [];
  let bonusesList: import("@/server/repos/bonus.repo").BonusRow[] = [];
  let reviewsList: import("@/server/repos/review.repo").ReviewRow[] = [];
  let escalationsList: import("@/server/repos/escalation.repo").EscalationRow[] = [];
  let auditLogsList: import("@/server/repos/audit.repo").AuditLogRow[] = [];

  if (tab === "overview") {
    timelineItems = await employeeProfileRepo.getOverviewTimeline(
      actor,
      employeeId
    );
  } else if (tab === "bonus") {
    bonusesList = await bonusRepo.listForEmployee(actor, employeeId);
  } else if (tab === "reviews") {
    reviewsList = await reviewRepo.listForEmployee(actor, employeeId);
  } else if (tab === "escalations") {
    escalationsList = await escalationRepo.listForEmployee(actor, employeeId);
  } else if (tab === "audit" && actor.role === "ADMIN") {
    auditLogsList = await auditRepo.listForEntity(actor, "USER", employeeId);
  }

  return (
    <ProfileClient
      actor={actor}
      profileSummary={profileSummary}
      activeTab={tab}
      tabData={{
        timelineItems,
        bonusesList,
        reviewsList,
        escalationsList,
        auditLogsList,
      }}
    />
  );
}
