import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { authConfig } from "./auth.config";
import type { Role } from "@/types";

const DUMMY_HASH = "$2a$10$e7Z8P0H8W5LzN1n2v8s4e.uNOPQRSTUVWXYZabcdefghijklmnopqr";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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
            .where(and(eq(users.email, email), isNull(users.deletedAt)))
            .limit(1);

          if (!userRecord || userRecord.length === 0) {
            // Anti-enumeration: execute dummy hash comparison to normalize execution timing
            await bcrypt.compare(plainPassword, DUMMY_HASH);
            return null;
          }

          const user = userRecord[0];

          if (user.status !== "ACTIVE") {
            // Account inactive or suspended
            await bcrypt.compare(plainPassword, DUMMY_HASH);
            return null;
          }

          const isValidPassword = await bcrypt.compare(
            plainPassword,
            user.passwordHash
          );

          if (!isValidPassword) {
            return null;
          }

          // Return sanitized user payload, never returning passwordHash
          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            fullName: user.fullName,
            role: user.role as Role,
            departmentId: user.departmentId,
            employeeCode: user.employeeCode,
            mustChangePassword: user.mustChangePassword,
            sessionVersion: user.sessionVersion ?? 1,
          };
        } catch (error) {
          console.error("Auth authorize error:", error);
          return null;
        }
      },
    }),
  ],
});
