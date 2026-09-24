import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { SessionUser } from "@/types";
import { ROLE_LANDING } from "@/lib/auth-routes";
import { dashboardRepo } from "@/server/repos/dashboard.repo";
import { LeadDashboard } from "@/components/app/LeadDashboard";

export default async function TeamLandingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user as unknown as SessionUser;

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  // Security Guard: Strict server-side RBAC enforcement
  if (user.role !== "LEAD") {
    redirect(ROLE_LANDING[user.role] || "/me");
  }

  const leadData = await dashboardRepo.getLeadData(user);
  return <LeadDashboard user={user} data={leadData} />;
}
