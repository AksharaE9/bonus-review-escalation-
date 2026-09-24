"use client";

import React, { useState, useTransition } from "react";
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
import { registerUserAction } from "@/server/actions/user";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface RegisterClientProps {
  departments: Array<{ id: string; name: string; code: string }>;
}

export function RegisterClient({ departments }: RegisterClientProps) {
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName || !email || !password) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const res = await registerUserAction({
        fullName,
        email,
        password,
        departmentId: departmentId && departmentId !== "none" ? departmentId : null,
        designation: designation.trim() || null,
        phone: phone.trim() || null,
      });

      if (res.error) {
        setErrorMessage(res.error);
        toast.error(res.error);
      } else {
        setIsSubmitted(true);
        toast.success("Registration submitted! Pending administrator approval.");
      }
    });
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-zinc-950 font-sans">
      {/* Left Column: Registration Form */}
      <div className="flex flex-col justify-between p-6 sm:p-12 lg:p-16 max-w-lg w-full mx-auto">
        <div>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign in</span>
          </Link>
        </div>

        <div className="py-8 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Request Account Access
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Submit your corporate registration to join Pulse. An administrator will review and activate your profile.
            </p>
          </div>

          {isSubmitted ? (
            <div className="p-6 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 space-y-4">
              <div className="flex items-center gap-2 font-medium text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Registration Request Submitted</span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                Your account for <strong className="font-semibold">{email}</strong> has been registered and queued in the administrator approval inbox.
              </p>
              <div className="pt-2">
                <Link href="/sign-in">
                  <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-9">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Full Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    placeholder="e.g. Maya Patel"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isPending}
                    required
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Work Email Address <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="maya@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isPending}
                    required
                    className="text-xs h-9"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Department
                    </Label>
                    <Select
                      value={departmentId}
                      onValueChange={setDepartmentId}
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Department</SelectItem>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name} ({d.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Designation / Role Title
                    </Label>
                    <Input
                      type="text"
                      placeholder="e.g. Frontend Engineer"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      disabled={isPending}
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Phone Number (Optional)
                  </Label>
                  <Input
                    type="tel"
                    placeholder="+91 98765 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isPending}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Password <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 8 characters"
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

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Confirm Password <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isPending}
                    required
                    className="text-xs h-9 font-mono"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 gap-1.5 mt-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    "Submit Registration Request"
                  )}
                </Button>
              </form>

              <div className="text-center pt-2">
                <span className="text-xs text-zinc-500">Already have an active account? </span>
                <Link
                  href="/sign-in"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
                >
                  Sign in here
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="text-[11px] text-zinc-400">
          Pulse People Operations · Registration approval governed by organization administrators.
        </div>
      </div>

      {/* Right Column: Information Panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-zinc-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-950 pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
            Account Governance
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Secure, Role-Gated Workforce Console
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            All account registrations are verified by Human Resources and Team Leadership to ensure strict organizational privacy, compensation confidentiality, and audit integrity.
          </p>
        </div>

        <div className="relative z-10 space-y-3 border-t border-zinc-800 pt-6">
          <div className="text-xs font-semibold text-zinc-300">Approval Workflow:</div>
          <div className="grid grid-cols-3 gap-3 text-[11px] text-zinc-400">
            <div className="p-2.5 rounded bg-zinc-800/60 border border-zinc-750">
              <span className="font-semibold text-zinc-200 block mb-1">1. Register</span>
              Submit corporate profile and credentials.
            </div>
            <div className="p-2.5 rounded bg-zinc-800/60 border border-zinc-750">
              <span className="font-semibold text-zinc-200 block mb-1">2. Admin Review</span>
              Admin assigns role & departmental scope.
            </div>
            <div className="p-2.5 rounded bg-zinc-800/60 border border-zinc-750">
              <span className="font-semibold text-zinc-200 block mb-1">3. Live Access</span>
              Sign in immediately with active permissions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
