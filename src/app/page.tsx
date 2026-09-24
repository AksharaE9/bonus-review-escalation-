import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  IndianRupee,
  FileCheck,
  ShieldAlert,
  Lock,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-indigo-500/20">
      {/* 1. Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-50">
              <span className="w-5 h-5 rounded bg-indigo-600 text-white flex items-center justify-center text-xs font-mono">
                P
              </span>
              <span>Pulse</span>
            </Link>
            <nav className="hidden md:flex items-center gap-5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
              <a href="#features" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                Features
              </a>
              <a href="#roles" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                Roles & Access
              </a>
              <a href="#security" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                Audit Integrity
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-3.5">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="py-16 sm:py-24 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column Copy */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Internal Operations Console
              </div>

              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
                Bonuses, reviews and escalations — in one place.
              </h1>

              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                An internal operations console where leadership records compensation, evaluates
                performance, and addresses grievances with a complete, tamper-evident audit trail.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <Link href="/sign-in">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-4 gap-1.5">
                    Sign in to Console
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button variant="outline" size="sm" className="text-xs h-9 px-4">
                    See how it works
                  </Button>
                </a>
              </div>
            </div>

            {/* Right Column: High-fidelity CSS/HTML UI Mock */}
            <div className="lg:col-span-6">
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-4 font-sans text-xs">
                {/* Mock Card Header */}
                <div className="bg-white dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center text-xs">
                        RK
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          Ravi Kumar
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          EMP-1004 · Senior Software Engineer · Engineering
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                      ACTIVE
                    </span>
                  </div>

                  {/* Mock Tabs */}
                  <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <span className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-900 dark:text-zinc-100 text-[11px]">
                      Bonus (₹75,000)
                    </span>
                    <span className="px-2.5 py-1 text-zinc-500 text-[11px]">Reviews (2)</span>
                    <span className="px-2.5 py-1 text-zinc-500 text-[11px]">Escalations (0)</span>
                  </div>

                  {/* Mock Bonus Entry */}
                  <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        ₹45,000.00
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
                        PAID
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-normal">
                      Exceptional execution on the Q3 serverless database migration and zero-downtime cutover.
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-200/60 dark:border-zinc-800 font-mono">
                      <span>PERFORMANCE · Sep 2026</span>
                      <span>Awarded by Anita Sharma</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Three Feature Cards */}
      <section id="features" className="py-16 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Three pillars of internal people operations
            </h2>
            <p className="text-xs text-zinc-500">
              Structured record keeping with mandatory context and clear ownership.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Bonus */}
            <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
              <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Bonus Tracking
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Record compensation with mandatory justification reasons (min 10 chars), multi-stage
                approval workflows, and strict employee visibility controls.
              </p>
            </div>

            {/* Card 2: Reviews */}
            <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
              <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                <FileCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Performance Reviews
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Structured multi-competency scoring, automated weighted calculations, silent draft
                autosave, and formal employee acknowledgement workflows.
              </p>
            </div>

            {/* Card 3: Escalations */}
            <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
              <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Escalation Management
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Rigorous SLA resolution tracking, management escalations, employee grievance intake,
                confidential flags, and threaded activity with internal notes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Roles Strip */}
      <section id="roles" className="py-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Strict role-based access control
            </h2>
            <p className="text-xs text-zinc-500">
              Enforced server-side per request on every data access path.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5 p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Administrator
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Full organizational oversight, final bonus approval, user provisioning, system settings,
                and exclusive access to the immutable audit log.
              </p>
            </div>

            <div className="space-y-1.5 p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Team Lead
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Scoped access to departmental staff, authoring performance reviews, initiating bonus
                recommendations, and resolving team escalations.
              </p>
            </div>

            <div className="space-y-1.5 p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Employee
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Private personal history tracking, review acknowledgement, and direct submission of
                confidential workplace grievances with SLA tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Audit Trust Row */}
      <section id="security" className="py-10 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-600 dark:text-zinc-400">
            <Lock className="w-4 h-4 text-zinc-500 shrink-0" />
            <span>
              Every mutation, approval, status transition, export, and authentication attempt is
              cryptographically correlated with a request ID and permanently appended to the tamper-evident audit ledger.
            </span>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="mt-auto py-8 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-zinc-700 dark:text-zinc-300">
            <span className="w-4 h-4 rounded bg-indigo-600 text-white flex items-center justify-center text-[10px] font-mono">
              P
            </span>
            <span>Pulse</span>
          </div>
          <div className="text-[11px] text-zinc-400">
            © {new Date().getFullYear()} Pulse. Internal enterprise people-operations system.
          </div>
        </div>
      </footer>
    </div>
  );
}
