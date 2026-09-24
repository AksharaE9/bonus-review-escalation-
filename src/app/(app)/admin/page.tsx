import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { SessionUser } from "@/types";
import { ROLE_LANDING } from "@/lib/auth-routes";
import { dashboardRepo } from "@/server/repos/dashboard.repo";
import { AdminDashboard } from "@/components/app/AdminDashboard";

export default async function AdminLandingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user as unknown as SessionUser;

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  // Security Guard: Strict server-side RBAC enforcement
  if (user.role !== "ADMIN") {
    redirect(ROLE_LANDING[user.role] || "/me");
  }

  const adminData = await dashboardRepo.getAdminData(user);
  return <AdminDashboard user={user} data={adminData} />;
}
