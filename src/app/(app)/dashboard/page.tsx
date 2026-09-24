import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";
import { dashboardRepo } from "@/server/repos/dashboard.repo";
import { AdminDashboard } from "@/components/app/AdminDashboard";
import { LeadDashboard } from "@/components/app/LeadDashboard";
import { UserDashboard } from "@/components/app/UserDashboard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user as unknown as SessionUser;

  if (user.role === "ADMIN") {
    const adminData = await dashboardRepo.getAdminData(user);
    return <AdminDashboard user={user} data={adminData} />;
  }

  if (user.role === "LEAD") {
    const leadData = await dashboardRepo.getLeadData(user);
    return <LeadDashboard user={user} data={leadData} />;
  }

  const userData = await dashboardRepo.getUserData(user);
  return <UserDashboard user={user} data={userData} />;
}
