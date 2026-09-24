import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import type { Role, SessionUser } from "@/types";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();
        const plainPassword = String(credentials.password);

        try {
          const userRecord = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!userRecord || userRecord.length === 0) {
            return null;
          }

          const user = userRecord[0];

          if (user.status !== "ACTIVE" || user.deletedAt) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(
            plainPassword,
            user.passwordHash
          );

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            role: user.role as Role,
            departmentId: user.departmentId,
            employeeCode: user.employeeCode,
            avatarUrl: user.avatarUrl,
            mustChangePassword: user.mustChangePassword,
          };
        } catch (error) {
          console.error("Auth authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as SessionUser).role;
        token.departmentId = (user as unknown as SessionUser).departmentId;
        token.employeeCode = (user as unknown as SessionUser).employeeCode;
        token.fullName = user.name;
        token.mustChangePassword = (user as unknown as SessionUser).mustChangePassword;
      }

      if (trigger === "update" && session) {
        if (session.mustChangePassword !== undefined) {
          token.mustChangePassword = session.mustChangePassword;
        }
        if (session.fullName) {
          token.fullName = session.fullName;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as SessionUser).id = token.id as string;
        (session.user as unknown as SessionUser).role = token.role as Role;
        (session.user as unknown as SessionUser).departmentId = (token.departmentId as string) ?? null;
        (session.user as unknown as SessionUser).employeeCode = (token.employeeCode as string) ?? "";
        (session.user as unknown as SessionUser).fullName = (token.fullName as string) ?? session.user.name ?? "";
        (session.user as unknown as SessionUser).mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    },
  },
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
});
