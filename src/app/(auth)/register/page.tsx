import React, { Suspense } from "react";
import { userRepo } from "@/server/repos/user.repo";
import { RegisterClient } from "./RegisterClient";

export default async function RegisterPage() {
  const departments = await userRepo.getDepartments();

  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-zinc-950" />}>
      <RegisterClient departments={departments} />
    </Suspense>
  );
}
