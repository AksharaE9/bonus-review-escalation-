"use client";

import React, { useState, useTransition } from "react";
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
import { registerUserAction } from "@/server/actions/user";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowLeft, Lock, ShieldCheck, Check } from "lucide-react";
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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 font-sans text-slate-900">
      {/* Left Column: Registration Form */}
      <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-10 lg:p-14 max-w-lg w-full mx-auto">
        <div>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign in</span>
          </Link>
        </div>

        <div className="py-6 space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Request Account Access
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Submit your corporate registration to join Pulse. An administrator will review and activate your profile.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs">
            {isSubmitted ? (
              <div className="p-6 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-950 space-y-4">
                <div className="flex items-center gap-2 font-semibold text-sm text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Registration Request Submitted</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Your account for <strong className="font-semibold text-emerald-950">{email}</strong> has been registered and queued in the administrator approval inbox.
                </p>
                <div className="pt-2">
                  <Link href="/sign-in">
                    <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-9 font-semibold">
                      Return to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {errorMessage && (
                  <div className="p-3 mb-4 rounded-md bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-800">
                      Full Name <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="e.g. Maya Patel"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isPending}
                      required
                      className="text-xs h-9 bg-white border-slate-300 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-800">
                      Work Email Address <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      placeholder="maya@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isPending}
                      required
                      className="text-xs h-9 bg-white border-slate-300 text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-800">
                        Department
                      </Label>
                      <Select value={departmentId} onValueChange={setDepartmentId} disabled={isPending}>
                        <SelectTrigger className="text-xs h-9 bg-white border-slate-300 text-slate-900">
                          <SelectValue placeholder="Select dept" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">-- None --</SelectItem>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id} className="text-xs">
                              {d.name} ({d.code})
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
                        placeholder="e.g. Product Analyst"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        disabled={isPending}
                        className="text-xs h-9 bg-white border-slate-300 text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-800">
                        Password <span className="text-rose-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isPending}
                          required
                          className="text-xs h-9 pr-7 font-mono bg-white border-slate-300 text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-800">
                        Confirm Password <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isPending}
                        required
                        className="text-xs h-9 font-mono bg-white border-slate-300 text-slate-900"
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
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isPending}
                      className="text-xs h-9 bg-white border-slate-300 text-slate-900"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9.5 font-semibold shadow-xs mt-2"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Submitting Application...
                      </>
                    ) : (
                      "Submit Access Request"
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center justify-between pt-4 border-t border-slate-200">
          <span>Pulse People Operations</span>
          <span className="font-mono text-[10px] text-slate-500">Live Approval Verification</span>
        </div>
      </div>

      {/* Right Column: Light Panel */}
      <div className="hidden lg:col-span-6 lg:flex flex-col justify-between p-10 lg:p-14 bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 border-l border-slate-200">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-xs font-mono font-bold">
            P
          </span>
          <span className="font-bold text-sm tracking-tight text-slate-900">Pulse Console</span>
        </div>

        <div className="space-y-6 my-auto max-w-lg">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              Join Your Organization&apos;s Performance Ledger
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Once approved by your HR or team administrator, you will gain access to your compensation records, quarterly performance reviews, and grievance resolution channels.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Verified Access</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Accounts are authenticated by human resources.
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Zero Latency</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Immediate access once admin approval triggers.
              </p>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white p-2">
            <Image
              src="/images/analytics-preview.jpg"
              alt="Performance Analytics Preview"
              width={600}
              height={340}
              className="rounded-lg object-cover w-full h-auto"
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
