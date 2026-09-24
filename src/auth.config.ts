import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/types";

if (!process.env.AUTH_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: AUTH_SECRET environment variable is missing.");
}

export const authConfig = {
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user.id as string) || (token.id as string);
        token.role = (user.role as Role) || (token.role as Role) || "USER";
        token.departmentId = user.departmentId ?? null;
        token.employeeCode = user.employeeCode ?? "";
        token.fullName = user.fullName ?? user.name ?? "";
        token.mustChangePassword = Boolean(user.mustChangePassword);
        token.sessionVersion = user.sessionVersion ?? 1;
      }

      if (trigger === "update" && session) {
        if (session.mustChangePassword !== undefined) {
          token.mustChangePassword = session.mustChangePassword;
        }
        if (session.fullName) {
          token.fullName = session.fullName;
        }
        if (session.sessionVersion !== undefined) {
          token.sessionVersion = session.sessionVersion;
        }
        if (session.role) {
          token.role = session.role;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.departmentId = (token.departmentId as string) ?? null;
        session.user.employeeCode = (token.employeeCode as string) ?? "";
        session.user.fullName = (token.fullName as string) ?? session.user.name ?? "";
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
        session.user.sessionVersion = Number(token.sessionVersion || 1);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
