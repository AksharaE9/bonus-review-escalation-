import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";
import { db } from "@/db";
import { appSettings } from "@/db/schema/settings";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user as unknown as SessionUser;
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const settingsRows = await db.select().from(appSettings);
  const settingsMap: Record<string, unknown> = {};
  settingsRows.forEach((r) => {
    settingsMap[r.key] = r.value;
  });

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <SettingsClient user={user} settings={settingsMap} />
    </div>
  );
}
