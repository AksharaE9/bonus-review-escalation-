import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { SessionUser } from "@/types";
import { dashboardRepo } from "@/server/repos/dashboard.repo";
import { UserDashboard } from "@/components/app/UserDashboard";

export default async function UserLandingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user as unknown as SessionUser;

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  // Security Guard: If an ADMIN or LEAD accesses /me directly, they can either view or redirect to their home
  if (user.role !== "USER") {
    // Both ADMIN and LEAD can view their personal user surface or redirect
  }

  const userData = await dashboardRepo.getUserData(user);
  return <UserDashboard user={user} data={userData} />;
}
