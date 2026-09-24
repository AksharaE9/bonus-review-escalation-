import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShellClient } from "@/components/app/AppShellClient";
import type { SessionUser } from "@/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user as unknown as SessionUser;

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  return <AppShellClient user={user}>{children}</AppShellClient>;
}
