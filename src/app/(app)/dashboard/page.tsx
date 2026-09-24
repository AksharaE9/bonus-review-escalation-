import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ROLE_LANDING } from "@/lib/auth-routes";
import type { SessionUser } from "@/types";

/**
 * Canonical Role Router
 * /dashboard serves as the central auth router. It verifies the server session,
 * ensures mustChangePassword compliance, and redirects to the role-specific landing surface.
 */
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user as unknown as SessionUser;

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  redirect(ROLE_LANDING[user.role] || "/me");
}
