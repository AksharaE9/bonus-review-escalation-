import React, { Suspense } from "react";
import { userRepo } from "@/server/repos/user.repo";
import { SignInClient } from "./SignInClient";

export default async function SignInPage() {
  const departments = await userRepo.getDepartments();

  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-zinc-950" />}>
      <SignInClient departments={departments} />
    </Suspense>
  );
}

