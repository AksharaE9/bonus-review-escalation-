import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Award,
  FileCheck2,
  AlertOctagon,
  Lock,
  ArrowRight,
  CheckCircle2,
  Activity,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-900">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-mono font-bold shadow-xs">
                P
              </span>
              <span className="tracking-tight">Pulse</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
              <a href="#features" className="hover:text-indigo-600 transition-colors">
                Platform Features
              </a>
              <a href="#governance" className="hover:text-indigo-600 transition-colors">
                Role Governance
              </a>
              <a href="#workflow" className="hover:text-indigo-600 transition-colors">
                How It Works
              </a>
              <a href="#security" className="hover:text-indigo-600 transition-colors">
                Audit Integrity
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/sign-in?mode=register">
              <Button variant="ghost" size="sm" className="text-xs font-semibold text-slate-700 hover:text-indigo-600">
                Register Request
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-4 font-semibold shadow-xs gap-1.5">
                <span>Sign in</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 border-b border-slate-200 bg-gradient-to-b from-white via-indigo-50/20 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-800 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Enterprise People Operations Ledger</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Bonuses, Reviews & Escalations — <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Unified in Real Time.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              A high-precision operations console for corporate leadership to record compensation awards, conduct multi-competency reviews, and resolve workplace grievances with immutable audit trails.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <Link href="/sign-in">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm h-11 px-6 font-semibold shadow-md gap-2">
                  <span>Open Console</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/sign-in?mode=register">
                <Button variant="outline" size="lg" className="text-sm h-11 px-6 font-semibold bg-white border-slate-300 text-slate-800 hover:bg-slate-50 shadow-xs">
                  Request Employee Access
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image Showcase */}
          <div className="mt-12 sm:mt-16 max-w-5xl mx-auto">
            <div className="rounded-2xl p-2 sm:p-3 bg-gradient-to-b from-indigo-500/10 via-slate-200 to-slate-200/50 border border-slate-300 shadow-xl">
              <div className="rounded-xl overflow-hidden bg-white border border-slate-200 shadow-inner">
                {/* Browser Frame Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-100/90 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 bg-white px-3 py-0.5 rounded border border-slate-200">
                    https://pulse.console.internal/dashboard
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Live Sync
                  </div>
                </div>

                {/* Dashboard Image */}
                <div className="relative w-full aspect-video bg-slate-100">
                  <Image
                    src="/images/dashboard-preview.jpg"
                    alt="Pulse Dashboard Preview"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Stats Bar */}
      <section className="py-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-slate-900 font-mono">100%</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audit Traceability</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-indigo-600 font-mono">&lt; 4s</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Sync Polling</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-slate-900 font-mono">3-Tier</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role Permissions (RBAC)</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-emerald-600 font-mono">Zero</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Data Ambiguity</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Three Pillar Feature Grid */}
      <section id="features" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Three Pillars of People Operations
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Clear accountability, structured records, and end-to-end audit tracking across every transaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1: Bonuses */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">Merit & Spot Bonuses</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Log performance, festive, and milestone bonuses with mandatory justification, department budgets, and multi-tier approval states.
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Configurable bonus types & currencies</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Real-time payout & draft tracking</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2: Reviews */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-4">
              <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">Performance Appraisals</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Conduct structured quarterly and annual reviews across 8 core competencies with weighted scoring and printable scorecard PDFs.
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Weighted competency matrices</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Employee acknowledgment workflow</span>
                </li>
              </ul>
            </div>

            {/* Pillar 3: Escalations */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-4">
              <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">Grievance Escalations</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Confidential incident intake with SLA deadline tracking, severity routing, resolution timelines, and anonymous employee reporting.
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Automated SLA clock (4h to 120h)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Strict privacy & internal notes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Analytics Feature Showcase Section */}
      <section id="workflow" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                <Activity className="w-4 h-4" />
                <span>Deep Performance Insights</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
                Transparent Talent Evaluation & Career Milestones
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Empower your organization with transparent historical progress. Track review timelines, goal fulfillment ratios, award badges, and department trends on a single interactive canvas.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Multi-Cycle Scorecards</h4>
                    <p className="text-xs text-slate-500">Historical evaluation graphs with weighted peer & lead ratings.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Live Registration Approval</h4>
                    <p className="text-xs text-slate-500">Admins review incoming account requests with instant role assignment.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-2xl p-2 bg-slate-100 border border-slate-200 shadow-md">
                <div className="rounded-xl overflow-hidden bg-white border border-slate-200">
                  <Image
                    src="/images/analytics-preview.jpg"
                    alt="Pulse Performance Analytics"
                    width={700}
                    height={400}
                    className="object-cover w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Security & Audit Footer CTA */}
      <section id="security" className="py-16 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-xs text-indigo-400 font-mono">
            <Lock className="w-3.5 h-3.5" />
            <span>Immutable Append-Only Audit Logging</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Ready to streamline people operations?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Log in to the console or submit an account registration request to access the platform.
          </p>
          <div className="pt-2">
            <Link href="/sign-in">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm h-11 px-8 font-semibold shadow-lg">
                Enter Pulse Console
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="py-8 bg-white border-t border-slate-200 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-indigo-600 text-white flex items-center justify-center text-xs font-mono font-bold">
              P
            </span>
            <span className="font-semibold text-slate-800">Pulse Enterprises</span>
            <span>· People Operations & Governance</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Serverless Neon DB</span>
            <span>·</span>
            <span>Vercel Deploy Optimized</span>
            <span>·</span>
            <span>Strict RBAC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
