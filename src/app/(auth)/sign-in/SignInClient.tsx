"use client";

import React, { useState, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  AlertCircle,
  ShieldCheck,
  Check,
} from "lucide-react";
import { signInAction, type SignInActionState } from "@/server/actions/auth";

export function SignInClient() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [state, formAction, isPending] = useActionState<SignInActionState, FormData>(
    signInAction,
    {}
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 font-sans text-slate-900">
      {/* Left Column: Form Box */}
      <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-10 lg:p-14 max-w-lg w-full mx-auto">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 font-bold text-base text-slate-900 hover:opacity-90 transition-opacity"
          >
            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-mono font-bold shadow-xs">
              P
            </span>
            <span className="tracking-tight text-lg">Pulse Console</span>
          </Link>
        </div>

        <div className="py-8 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Sign in to your account
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Enter your corporate credentials to access your console dashboard.
              </p>
            </div>

            {/* Inline Error Alert */}
            {state?.error && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-900 animate-in fade-in duration-200"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium">{state.error}</span>
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="callbackUrl" value={callbackUrl} />

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-800">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@pulse.local"
                  disabled={isPending}
                  required
                  autoComplete="email"
                  className="text-xs h-9.5 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-800">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    disabled={isPending}
                    required
                    autoComplete="current-password"
                    className="text-xs h-9.5 pr-9 font-mono bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9.5 gap-1.5 font-semibold shadow-xs transition-colors"
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
        </div>

        <div className="text-[11px] text-slate-400 flex items-center justify-between pt-4 border-t border-slate-200">
          <span>Pulse People Operations</span>
          <span className="font-mono text-[10px] text-slate-500">
            Enterprise RBAC & TLS Protected
          </span>
        </div>
      </div>

      {/* Right Column: Premium Light Panel */}
      <div className="hidden lg:col-span-6 lg:flex flex-col justify-between p-10 lg:p-14 bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 border-l border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-xs font-mono font-bold">
              P
            </span>
            <span className="font-bold text-sm tracking-tight text-slate-900">
              Pulse Enterprise
            </span>
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
