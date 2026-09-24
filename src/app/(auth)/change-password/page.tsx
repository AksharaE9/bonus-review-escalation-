import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ChangePasswordClient } from "./ChangePasswordClient";

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  return <ChangePasswordClient />;
}
