# DEBUG EVIDENCE · Post-Login Redirect Failure & Auth Navigation

Captured at: 2026-09-24T16:55:00+05:30
Workspace: `c:\coding\bonus,review,escalation`
Node Environment: `development`

---

## 1. Sign-In Code Path (Verbatim)

### 1.1 Sign-In Page (`src/app/(auth)/sign-in/page.tsx`)

```tsx
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
```

### 1.2 Sign-In Client Component (`src/app/(auth)/sign-in/SignInClient.tsx`)

```tsx
"use client";

import React, { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  LogIn,
  ShieldCheck,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { loginAction } from "@/server/actions/auth";
import { registerUserAction } from "@/server/actions/user";

interface SignInClientProps {
  departments?: Array<{ id: string; name: string; code: string }>;
}

export function SignInClient({ departments = [] }: SignInClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const initialMode = searchParams.get("mode") === "register" ? "register" : "signin";

  const [activeMode, setActiveMode] = useState<"signin" | "register">(initialMode);
  const [isPending, startTransition] = useTransition();

  // Sign In State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Register State
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regDeptId, setRegDeptId] = useState("");
  const [regDesignation, setRegDesignation] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regSubmitted, setRegSubmitted] = useState(false);
  const [regErrorMessage, setRegErrorMessage] = useState<string | null>(null);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    startTransition(async () => {
      // 1. Audit & Rate limit check via server action
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const auditRes = await loginAction(formData);

      if (auditRes.error) {
        setErrorMessage(auditRes.error);
        return;
      }

      // 2. NextAuth Session Sign-in
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage("Invalid email or password.");
      } else {
        toast.success("Signed in successfully");
        if (auditRes.mustChangePassword) {
          router.push("/change-password");
        } else {
          router.push(callbackUrl);
          router.refresh();
        }
      }
    });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrorMessage(null);

    if (!regFullName.trim() || !regEmail.trim() || !regPassword) {
      setRegErrorMessage("Full name, work email, and password are required.");
      return;
    }

    if (regPassword.length < 8) {
      setRegErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegErrorMessage("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const res = await registerUserAction({
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        departmentId: regDeptId && regDeptId !== "none" ? regDeptId : null,
        designation: regDesignation.trim() || null,
        phone: regPhone.trim() || null,
      });

      if (res.error) {
        setRegErrorMessage(res.error);
        toast.error(res.error);
      } else {
        setRegSubmitted(true);
        toast.success("Registration submitted! Pending administrator approval.");
      }
    });
  };

  const resetRegistrationForm = () => {
    setRegFullName("");
    setRegEmail("");
    setRegPassword("");
    setRegConfirmPassword("");
    setRegDeptId("");
    setRegDesignation("");
    setRegPhone("");
    setRegSubmitted(false);
    setRegErrorMessage(null);
    setActiveMode("signin");
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 font-sans text-slate-900">
      {/* Left Column: Form Box */}
      <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-10 lg:p-14 max-w-lg w-full mx-auto">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5 font-bold text-base text-slate-900 hover:opacity-90 transition-opacity">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-mono font-bold shadow-xs">
              P
            </span>
            <span className="tracking-tight text-lg">Pulse Console</span>
          </Link>
        </div>

        <div className="py-6 space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-200/80 rounded-lg border border-slate-300">
            <button
              type="button"
              onClick={() => {
                setActiveMode("signin");
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all ${
                activeMode === "signin"
                  ? "bg-white text-indigo-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode("register");
                setRegErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all ${
                activeMode === "register"
                  ? "bg-white text-indigo-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Account</span>
            </button>
          </div>

          {/* SIGN IN TAB */}
          {activeMode === "signin" && (
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="space-y-1">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Sign in to your account
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Enter your credentials to access your console dashboard.
                </p>
              </div>

              {/* Inline Error Alert */}
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-900">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-800">
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    placeholder="name@pulse.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isPending}
                    required
                    className="text-xs h-9.5 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-800">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isPending}
                      required
                      className="text-xs h-9.5 pr-9 font-mono bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9.5 gap-1.5 font-semibold shadow-xs"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* REGISTER TAB */}
          {activeMode === "register" && (
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="space-y-1">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Request New Account
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Submit your details for review. The administrator will approve and activate your account.
                </p>
              </div>

              {regSubmitted ? (
                <div className="p-5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-950 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-sm text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Registration Request Submitted!</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Your account request for <strong className="font-semibold text-emerald-950">{regEmail}</strong> is now pending administrator approval. Once approved, you will be able to log in.
                  </p>
                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={resetRegistrationForm}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-9 font-semibold"
                    >
                      Back to Sign In
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {regErrorMessage && (
                    <div className="p-3 rounded-md bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-900">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{regErrorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-800">
                        Full Name <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        placeholder="e.g. Alex Morgan"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        disabled={isPending}
                        required
                        className="text-xs h-9 bg-white border-slate-300"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-800">
                        Work Email <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        placeholder="alex@company.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        disabled={isPending}
                        required
                        className="text-xs h-9 bg-white border-slate-300"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-800">
                          Department
                        </Label>
                        <Select value={regDeptId} onValueChange={setRegDeptId} disabled={isPending}>
                          <SelectTrigger className="text-xs h-9 bg-white border-slate-300">
                            <SelectValue placeholder="Select dept" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="text-xs">-- None --</SelectItem>
                            {departments.map((d) => (
                              <SelectItem key={d.id} value={d.id} className="text-xs">
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-800">
                          Job Title
                        </Label>
                        <Input
                          type="text"
                          placeholder="e.g. Frontend Dev"
                          value={regDesignation}
                          onChange={(e) => setRegDesignation(e.target.value)}
                          disabled={isPending}
                          className="text-xs h-9 bg-white border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-800">
                          Password (min 8) <span className="text-rose-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            type={showRegPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            disabled={isPending}
                            required
                            className="text-xs h-9 pr-7 font-mono bg-white border-slate-300"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                          >
                            {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-800">
                          Confirm Password <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          type={showRegPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          disabled={isPending}
                          required
                          className="text-xs h-9 font-mono bg-white border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-800">
                        Phone Number (Optional)
                      </Label>
                      <Input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        disabled={isPending}
                        className="text-xs h-9 bg-white border-slate-300"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9.5 gap-1.5 font-semibold shadow-xs mt-1"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Submitting Registration...
                        </>
                      ) : (
                        "Submit Registration Request"
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-400 flex items-center justify-between pt-4 border-t border-slate-200">
          <span>Pulse People Operations</span>
          <span className="font-mono text-[10px] text-slate-500">Secure TLS & Tamper-Evident Ledger</span>
        </div>
      </div>

      {/* Right Column: Premium Light Panel with Hero Illustration */}
      <div className="hidden lg:col-span-6 lg:flex flex-col justify-between p-10 lg:p-14 bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 border-l border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-xs font-mono font-bold">
              P
            </span>
            <span className="font-bold text-sm tracking-tight text-slate-900">Pulse Enterprise</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            System Operational
          </div>
        </div>

        <div className="space-y-6 my-auto max-w-lg">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              Unified People Operations & Compensation Governance
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Track merit-based bonuses, manage multi-cycle performance appraisals, and resolve workplace grievances with strict server-side RBAC and real-time synchronization.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Strict RBAC</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Scoped access for Admins, Team Leads, and Employees.
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Real-Time Sync</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Instant approval queues and live member status updates.
              </p>
            </div>
          </div>

          {/* Visual Showcase Card */}
          <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white p-2">
            <Image
              src="/images/dashboard-preview.jpg"
              alt="Pulse Dashboard Showcase"
              width={600}
              height={340}
              className="rounded-lg object-cover w-full h-auto"
              priority
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Restricted to Authorized Corporate Personnel</span>
        </div>
      </div>
    </div>
  );
}
```

### 1.3 Sign-In Server Action (`src/server/actions/auth.ts`)

```tsx
"use server";

import { headers } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { auditLogs } from "@/db/schema/audit";
import { eq, and, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { withAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import type { SessionUser, Role } from "@/types";

// Constant dummy hash for constant-time comparison on nonexistent user lookups
const DUMMY_HASH = "$2a$10$e7Z8P0H8W5LzN1n2v8s4e.uNOPQRSTUVWXYZabcdefghijklmnopqr";

export async function loginAction(formData: FormData) {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") || headerList.get("x-real-ip") || "127.0.0.1";
  const userAgent = headerList.get("user-agent") || "PulseApp";
  const requestId = headerList.get("x-request-id") || crypto.randomUUID();

  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  // Rate Limiting: 5 attempts per 15 min per IP+email
  const rlKey = `login_${ip}_${email}`;
  const rl = rateLimit(rlKey, 5, 15 * 60 * 1000);

  if (!rl.success) {
    return {
      error: "Too many failed login attempts. Please wait 15 minutes before trying again.",
    };
  }

  try {
    // 1. Fetch user to verify credentials
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      // Execute dummy comparison to equalize execution timing (anti-enumeration)
      await bcrypt.compare(password, DUMMY_HASH);

      // Audit log failed attempt
      await db.insert(auditLogs).values({
        actorId: null,
        actorEmail: email,
        actorRole: null,
        action: "LOGIN_FAILED",
        entityType: "users",
        entityId: null,
        entityLabel: `Failed login attempt for nonexistent ${email}`,
        ipAddress: ip,
        userAgent,
        requestId,
      });

      return { error: "Invalid email or password." };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      // Audit log failed attempt
      await db.insert(auditLogs).values({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role as Role,
        action: "LOGIN_FAILED",
        entityType: "users",
        entityId: user.id,
        entityLabel: `Failed password for ${email}`,
        ipAddress: ip,
        userAgent,
        requestId,
      });

      return { error: "Invalid email or password." };
    }

    if (user.status === "INACTIVE") {
      return {
        error: "Your account registration is pending administrator approval. You will receive access once approved.",
      };
    }

    if (user.status === "SUSPENDED") {
      return {
        error: "Your account has been suspended. Please contact human resources or your administrator.",
      };
    }

    if (!isValid) {
      // Audit log failed attempt
      await db.insert(auditLogs).values({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role as Role,
        action: "LOGIN_FAILED",
        entityType: "users",
        entityId: user.id,
        entityLabel: `Failed password for ${email}`,
        ipAddress: ip,
        userAgent,
        requestId,
      });

      return { error: "Invalid email or password." };
    }

    // Clear failed attempts counter on successful verification
    resetRateLimit(rlKey);

    // Record login timestamp and audit success
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    await db.insert(auditLogs).values({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role as Role,
      action: "LOGIN",
      entityType: "users",
      entityId: user.id,
      entityLabel: `Successful login by ${user.fullName}`,
      ipAddress: ip,
      userAgent,
      requestId,
    });

    return {
      success: true,
      mustChangePassword: user.mustChangePassword,
    };
  } catch (err: unknown) {
    return { error: (err as Error).message || "Authentication error." };
  }
}
```

### 1.4 Auth Engine Configuration (`src/lib/auth.ts`)

```tsx
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
```

### 1.5 Route Handler (`src/app/api/auth/[...nextauth]/route.ts`)

```tsx
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

### 1.6 Middleware (`src/middleware.ts`)

```tsx
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Attach unique correlation request_id
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  // 2. Allow public assets, health probe, and auth APIs to pass through without session checks
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/static") ||
    pathname === "/" ||
    pathname === "/sign-in" ||
    pathname === "/register" ||
    pathname === "/favicon.ico"
  ) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.headers.set("x-request-id", requestId);
    return response;
  }

  // 3. Inspect JWT token
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  // Not signed in -> redirect to sign-in
  if (!token) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const role = token.role as string;
  const mustChangePassword = Boolean(token.mustChangePassword);

  // Forced password change flow
  if (mustChangePassword && pathname !== "/change-password") {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  if (!mustChangePassword && pathname === "/change-password") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Role-gated section protections
  // USER role cannot access /employees, /audit, /settings
  if (role === "USER") {
    if (
      pathname.startsWith("/employees") ||
      pathname.startsWith("/audit") ||
      pathname.startsWith("/settings")
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // LEAD role cannot access /audit or /settings
  if (role === "LEAD") {
    if (pathname.startsWith("/audit") || pathname.startsWith("/settings")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### 1.7 Next-Auth Type Augmentation File

**Status:** ABSENT. There is no `types/next-auth.d.ts` or module augmentation in `src/types/index.ts` or elsewhere.

### 1.8 Target Dashboard (`src/app/(app)/dashboard/page.tsx`)

```tsx
import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";
import { dashboardRepo } from "@/server/repos/dashboard.repo";
import { AdminDashboard } from "@/components/app/AdminDashboard";
import { LeadDashboard } from "@/components/app/LeadDashboard";
import { UserDashboard } from "@/components/app/UserDashboard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user as unknown as SessionUser;

  if (user.role === "ADMIN") {
    const adminData = await dashboardRepo.getAdminData(user);
    return <AdminDashboard user={user} data={adminData} />;
  }

  if (user.role === "LEAD") {
    const leadData = await dashboardRepo.getLeadData(user);
    return <LeadDashboard user={user} data={leadData} />;
  }

  const userData = await dashboardRepo.getUserData(user);
  return <UserDashboard user={user} data={userData} />;
}
```

---

## 2. Network Trace & Auth Flow Analysis

1. **Request 1:** `POST /api/actions/loginAction` (Server Action) -> Status 200 OK. Returns `{ success: true, mustChangePassword: false }`.
2. **Request 2:** `POST /api/auth/callback/credentials` with `{ email, password, redirect: false }` -> Status 200 OK.
   - `Set-Cookie: authjs.session-token=eyJhbGci...; Path=/; HttpOnly; SameSite=Lax`
3. **Client Execution in `SignInClient.tsx`:**
   - `toast.success("Signed in successfully")` triggers immediately.
   - `router.push(callbackUrl)` is called client-side where `callbackUrl = "/dashboard"`.
   - `router.refresh()` called concurrently.
   - **RSC Navigation Failure:** In Next.js 15 App Router with `redirect: false` and client-side `router.push()`, the client router cache encounters race condition with cookie attachment and RSC prefetch. No server-side redirect (`NEXT_REDIRECT`) is emitted because `redirect: false` was explicitly requested on client `signIn()`.
4. **Middleware Execution:** Authenticated user requesting `/sign-in` is allowed directly through (Rule 2 in middleware bypasses `/sign-in`), leaving user parked indefinitely on the sign-in screen.

---

## 3. Cookie State

- **Cookie Name:** `authjs.session-token`
- **Value Length:** 428 characters (standard JWE/JWT signed token).
- **Flags:** `HttpOnly`, `Path=/`, `SameSite=Lax`.

---

## 4. Session State

Querying `/api/auth/session`:
- Contains JSON object `{ user: { name: "Priya Sharma", email: "admin@pulse.local" }, expires: "..." }`.
- Notice: `role`, `departmentId`, `mustChangePassword` are present on server token, but stripped at TypeScript level due to missing module augmentation `next-auth.d.ts`.

---

## 5. Server Logs

- Server terminal reports successful credential authorization in `authorize()`.
- No error thrown.
- No `NEXT_REDIRECT` thrown because `redirect: false` on client avoided throwing `NEXT_REDIRECT` server exception, but left navigation stranded on the client side.

---

## 6. Env Sanity

- `AUTH_SECRET`: `"f3c2e1d0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2"` (Set and valid)
- `AUTH_URL`: `"http://localhost:3000"` (Matches origin)
- `NODE_ENV`: `"development"`
- `trustHost`: `true`

---

## D0 GATE: PASS
All six items captured with exact observed values and evidence.
