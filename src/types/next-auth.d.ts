import type { DefaultSession } from "next-auth";
import type { Role } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      departmentId: string | null;
      employeeCode?: string;
      fullName?: string;
      mustChangePassword: boolean;
      sessionVersion: number;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
    departmentId?: string | null;
    employeeCode?: string;
    fullName?: string;
    mustChangePassword?: boolean;
    sessionVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    departmentId: string | null;
    employeeCode?: string;
    fullName?: string;
    mustChangePassword: boolean;
    sessionVersion: number;
  }
}
