"use client";

import React, { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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

  // Quick fill demo credentials
  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setActiveMode("signin");
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-zinc-950 font-sans">
      {/* Left Column: Form Box */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-14 max-w-lg w-full mx-auto">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-base text-zinc-900 dark:text-zinc-50">
            <span className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-xs font-mono">
              P
            </span>
            <span>Pulse Console</span>
          </Link>
        </div>

        <div className="py-6 space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setActiveMode("signin");
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-all ${
                activeMode === "signin"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
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
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-all ${
                activeMode === "register"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Account</span>
            </button>
          </div>

          {/* SIGN IN TAB */}
          {activeMode === "signin" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Sign in to your account
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Enter your credentials to access your console dashboard.
                </p>
              </div>

              {/* Inline Error Alert */}
              {errorMessage && (
                <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSignInSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    placeholder="name@pulse.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isPending}
                    required
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
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
                      className="text-xs h-9 pr-8 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 gap-1.5 font-medium shadow-sm"
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

              {/* Quick Demo Credentials */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>Active System Logins</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-normal">● 2 Verified</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemoAccount("admin@pulse.local", "Admin@12345")}
                    className="p-2.5 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-left text-[11px] transition-colors"
                  >
                    <span className="block font-semibold text-zinc-900 dark:text-zinc-100">Admin</span>
                    <span className="text-[10px] text-zinc-500 block truncate">Priya Sharma · HR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount("lead@pulse.local", "Lead@12345")}
                    className="p-2.5 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-left text-[11px] transition-colors"
                  >
                    <span className="block font-semibold text-zinc-900 dark:text-zinc-100">Team Lead</span>
                    <span className="text-[10px] text-zinc-500 block truncate">Rajesh Menon · Eng</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* REGISTER TAB */}
          {activeMode === "register" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Request New Account
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Submit your details for review. The administrator will approve and activate your account.
                </p>
              </div>

              {regSubmitted ? (
                <div className="p-5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Registration Request Submitted!</span>
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                    Your account request for <strong className="font-semibold">{regEmail}</strong> is now pending administrator approval. Once accepted, you will be able to log in.
                  </p>
                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={resetRegistrationForm}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-9"
                    >
                      Back to Sign In
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {regErrorMessage && (
                    <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{regErrorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Full Name <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        placeholder="e.g. Alex Morgan"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        disabled={isPending}
                        required
                        className="text-xs h-8.5"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Work Email <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        placeholder="alex@company.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        disabled={isPending}
                        required
                        className="text-xs h-8.5"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Department
                        </Label>
                        <Select value={regDeptId} onValueChange={setRegDeptId} disabled={isPending}>
                          <SelectTrigger className="text-xs h-8.5">
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
                        <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Job Title
                        </Label>
                        <Input
                          type="text"
                          placeholder="e.g. Frontend Dev"
                          value={regDesignation}
                          onChange={(e) => setRegDesignation(e.target.value)}
                          disabled={isPending}
                          className="text-xs h-8.5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
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
                            className="text-xs h-8.5 pr-7 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                          >
                            {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Confirm Password <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          type={showRegPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          disabled={isPending}
                          required
                          className="text-xs h-8.5 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Phone Number (Optional)
                      </Label>
                      <Input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        disabled={isPending}
                        className="text-xs h-8.5"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 gap-1.5 font-medium shadow-sm mt-1"
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

        <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span>Pulse People Operations</span>
          <span className="font-mono text-[10px] text-zinc-500">Real-Time Sync Ready</span>
        </div>
      </div>

      {/* Right Column: Solid Dark Panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 lg:p-16 bg-zinc-950 text-white border-l border-zinc-900">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-indigo-600 text-white flex items-center justify-center text-xs font-mono">
            P
          </span>
          <span className="font-bold text-sm tracking-tight text-white">Pulse Console</span>
        </div>

        <div className="space-y-4 max-w-md">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-100 leading-snug">
            Employee Bonus, Review & Escalation Management System
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Secure, tamper-evident people-operations ledger with strict server-side RBAC, automated SLA
            tracking, real-time approval queues, and full transaction auditing.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
          <Lock className="w-3.5 h-3.5" />
          <span>Restricted to Authorized Corporate Personnel</span>
        </div>
      </div>
    </div>
  );
}
