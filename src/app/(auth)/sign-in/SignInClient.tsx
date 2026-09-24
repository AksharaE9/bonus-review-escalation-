"use client";

import React, { useState, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
  BarChart3,
  Award,
  FileCheck2,
  AlertOctagon,
  Users,
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
      {/* Left Column: Form */}
      <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-14 max-w-lg w-full mx-auto">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 font-bold text-base text-slate-900 hover:opacity-90 transition-opacity"
          >
            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-mono font-bold shadow-xs">
              P
            </span>
            <span className="tracking-tight text-base">Pulse Console</span>
          </Link>
        </div>

        <div className="py-8 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Sign in to your account
              </h1>
              <p className="text-xs text-slate-500">
                Enter your corporate credentials to access your dashboard.
              </p>
            </div>

            {/* Inline Error Alert */}
            {state?.error && (
              <div
                role="alert"
                aria-live="polite"
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
                  placeholder="name@company.com"
                  disabled={isPending}
                  required
                  autoComplete="email"
                  className="text-xs h-9 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-600"
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
                    className="text-xs h-9 pr-9 font-mono bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 transition-colors"
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
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 gap-1.5 font-semibold shadow-xs transition-colors"
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
            Enterprise RBAC · TLS Protected
          </span>
        </div>
      </div>

      {/* Right Column: Component-built visual panel — no stock images */}
      <div className="hidden lg:col-span-7 lg:flex flex-col justify-between p-10 lg:p-14 bg-slate-50 border-l border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-xs font-mono font-bold">
              P
            </span>
            <span className="font-bold text-sm tracking-tight text-slate-900">
              Pulse Enterprise
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            System Operational
          </div>
        </div>

        <div className="space-y-5 my-auto max-w-2xl">
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
              Unified People Operations &amp; Compensation Governance
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Track merit-based bonuses, manage multi-cycle performance appraisals, and resolve
              workplace grievances with strict server-side RBAC and full audit integrity.
            </p>
          </div>

          {/* Component-built mini dashboard mock */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px] font-semibold text-slate-700">Admin Overview</span>
            </div>
            <div className="p-4 space-y-3">
              {/* Mini stat row */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Pending Bonuses", val: "4", color: "text-amber-700" },
                  { label: "Open Escalations", val: "7", color: "text-rose-700" },
                  { label: "Active Reviews", val: "18", color: "text-indigo-700" },
                ].map((s) => (
                  <div key={s.label} className="text-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className={`text-base font-bold font-mono tabular-nums ${s.color}`}>{s.val}</div>
                    <div className="text-[9px] text-slate-500 leading-tight mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Mini nav list */}
              <div className="space-y-1">
                {[
                  { icon: Users, label: "Employee Directory", sub: "25 active members" },
                  { icon: Award, label: "Bonus Ledger", sub: "32 records this cycle" },
                  { icon: FileCheck2, label: "Performance Reviews", sub: "18 submitted" },
                  { icon: AlertOctagon, label: "Grievance Queue", sub: "3 SLA overdue" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-slate-50">
                    <Icon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <div>
                      <div className="text-[11px] font-semibold text-slate-800">{label}</div>
                      <div className="text-[9px] text-slate-400">{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature highlights — 2-col grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Strict RBAC</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Scoped access for Admins, Team Leads, and Employees — enforced server-side.
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Append-Only Audit</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Every mutation writes an immutable audit row with actor, action, and payload diff.
              </p>
            </div>
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
