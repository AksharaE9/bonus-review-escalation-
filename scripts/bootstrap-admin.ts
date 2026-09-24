#!/usr/bin/env node
/**
 * scripts/bootstrap-admin.ts
 *
 * Creates the initial ADMIN user on an empty database.
 * Uses BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD environment variables.
 *
 * Refuses to run if:
 *   - DATABASE_URL is not set
 *   - Any user already exists (prevents clobbering an existing deployment)
 *   - Password does not meet minimum strength requirements
 *
 * Prints the admin email to stdout only. Never prints the password.
 * Sets must_change_password = true so the admin must set a permanent password on first login.
 */

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
import ws from "ws";
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";
import * as schema from "../src/db/schema";

dotenv.config();
neonConfig.webSocketConstructor = ws;

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_REQUIRES_UPPERCASE = true;
const PASSWORD_REQUIRES_NUMBER = true;
const PASSWORD_REQUIRES_SPECIAL = true;

function validatePassword(password: string): string[] {
  const errors: string[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
  }
  if (PASSWORD_REQUIRES_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }
  if (PASSWORD_REQUIRES_NUMBER && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number.");
  }
  if (PASSWORD_REQUIRES_SPECIAL && !/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must contain at least one special character.");
  }
  return errors;
}

async function bootstrapAdmin() {
  const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!url?.trim()) {
    console.error("❌ Bootstrap failed: DATABASE_URL is not set.");
    process.exit(1);
  }

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!email || !email.includes("@")) {
    console.error("❌ Bootstrap failed: BOOTSTRAP_ADMIN_EMAIL is not set or invalid.");
    process.exit(1);
  }

  if (!password) {
    console.error("❌ Bootstrap failed: BOOTSTRAP_ADMIN_PASSWORD is not set.");
    process.exit(1);
  }

  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    console.error("❌ Bootstrap failed: Password does not meet strength requirements:");
    passwordErrors.forEach((e) => console.error(`   - ${e}`));
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  try {
    console.log("🔍 Checking for existing users...");
    const existingUsers = await db.select({ id: schema.users.id }).from(schema.users).limit(1);

    if (existingUsers.length > 0) {
      console.error("❌ Bootstrap blocked: At least one user already exists in the database.");
      console.error("   This script only runs on an empty database.");
      console.error("   Use the Admin → Settings → Users panel to add more accounts.");
      process.exit(1);
    }

    console.log("🔐 Hashing password...");
    const passwordHash = await bcrypt.hash(password, 12);

    console.log(`📋 Creating admin account: ${email}`);
    const [adminUser] = await db.insert(schema.users).values({
      email,
      passwordHash,
      fullName: "System Administrator",
      role: "ADMIN",
      status: "ACTIVE",
      mustChangePassword: true,
    }).returning({ id: schema.users.id, email: schema.users.email });

    // Write audit log for bootstrap
    await db.insert(schema.auditLogs).values({
      actorId: adminUser.id,
      actorRole: "ADMIN",
      action: "CREATE",
      entityType: "User",
      entityId: adminUser.id,
      newData: { email: adminUser.email, role: "ADMIN", source: "bootstrap-admin" },
    });

    console.log("✅ Admin account created successfully.");
    console.log(`   Email: ${adminUser.email}`);
    console.log("   Role: ADMIN");
    console.log("   Status: ACTIVE");
    console.log("   Must change password on first login: YES");
    console.log("");
    console.log("   Sign in at your deployment URL, then change the password immediately.");
    console.log("   Then create departments and team lead accounts through the Admin panel.");
  } finally {
    await pool.end();
  }
}

bootstrapAdmin().catch((err) => {
  console.error("❌ Bootstrap error:", err.message);
  process.exit(1);
});
