import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Award,
  FileCheck2,
  AlertOctagon,
  Lock,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  BarChart3,
  Users,
  ClipboardList,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-header w-full border-b border-border bg-card/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-base text-slate-900">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-mono font-bold shadow-xs">
                P
              </span>
              <span className="tracking-tight">Pulse</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
              <a href="#features" className="hover:text-indigo-600 transition-colors">
                Features
              </a>
              <a href="#governance" className="hover:text-indigo-600 transition-colors">
                Role Governance
              </a>
              <a href="#security" className="hover:text-indigo-600 transition-colors">
                Audit Integrity
              </a>
            </nav>
          </div>

          <Link href="/sign-in">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-4 font-semibold shadow-xs gap-1.5">
              <span>Sign in</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-14 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div>
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-3">
                  Enterprise People Operations
                </p>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  Bonuses, Reviews &amp; Escalations — one console.
                </h1>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                A structured operations console for HR and leadership to record compensation awards,
                conduct competency-based performance reviews, and resolve workplace grievances with
                immutable audit trails.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <Link href="/sign-in">
                  <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm h-10 px-6 font-semibold shadow-sm gap-2">
                    <span>Open Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Restricted to authorized corporate personnel</span>
              </div>
            </div>

            {/* Component-built product mock — no stock images */}
            <div className="lg:col-span-7">
              <div className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                {/* Mock browser chrome */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 bg-white px-3 py-0.5 rounded border border-slate-200">
                    pulse.console.internal / admin
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Live
                  </div>
                </div>

                {/* Mock app shell */}
                <div className="flex h-64 sm:h-80 bg-slate-50">
                  {/* Mock sidebar */}
                  <div className="w-44 flex-shrink-0 bg-white border-r border-slate-200 p-3 space-y-1">
                    <div className="px-2 py-1.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-semibold flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5" />
                      Dashboard
                    </div>
                    {[
                      { icon: Users, label: "Employees" },
                      { icon: Award, label: "Bonuses" },
                      { icon: FileCheck2, label: "Reviews" },
                      { icon: AlertOctagon, label: "Escalations" },
                      { icon: ClipboardList, label: "Audit Log" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="px-2 py-1.5 rounded-md text-slate-500 text-[11px] font-medium flex items-center gap-2 hover:bg-slate-50">
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </div>
                    ))}
                  </div>

                  {/* Mock content area */}
                  <div className="flex-1 p-4 space-y-3 overflow-hidden">
                    {/* Stat tiles */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Pending Approvals", val: "4", color: "text-amber-600" },
                        { label: "Open Escalations", val: "7", color: "text-rose-600" },
                        { label: "Reviews This Cycle", val: "18", color: "text-indigo-600" },
                      ].map((s) => (
                        <div key={s.label} className="bg-white rounded-lg border border-slate-200 p-2.5">
                          <div className={`text-lg font-bold font-mono tabular-nums ${s.color}`}>{s.val}</div>
                          <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Mock table */}
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-700">Recent Bonuses</span>
                        <span className="text-[10px] text-indigo-600 font-medium">View all →</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {[
                          { name: "Engineering Lead", type: "PERFORMANCE", amt: "₹75,000", status: "PAID", statusColor: "text-emerald-700 bg-emerald-50 border-emerald-200" },
                          { name: "Product Manager", type: "SPOT", amt: "₹50,000", status: "PENDING", statusColor: "text-amber-700 bg-amber-50 border-amber-200" },
                          { name: "Dev Operations", type: "MILESTONE", amt: "₹1,20,000", status: "APPROVED", statusColor: "text-indigo-700 bg-indigo-50 border-indigo-200" },
                        ].map((row) => (
                          <div key={row.name} className="px-3 py-1.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                                {row.name[0]}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] font-semibold text-slate-800 truncate">{row.name}</div>
                                <div className="text-[9px] text-slate-400">{row.type}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="font-mono tabular-nums text-[10px] font-semibold text-slate-700">{row.amt}</span>
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${row.statusColor}`}>{row.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. System facts bar — only claims traceable to architecture */}
      <section className="py-7 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">100%</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audit Traceability</div>
            </div>
            <div className="space-y-1">
              <div className="text-xl font-bold text-indigo-600 font-mono tabular-nums">3-Tier</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role Permissions</div>
            </div>
            <div className="space-y-1">
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">13</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">DB Tables</div>
            </div>
            <div className="space-y-1">
              <div className="text-xl font-bold text-emerald-600 font-mono tabular-nums">HTTPS</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">TLS Encrypted</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Three-pillar feature grid */}
      <section id="features" className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Three modules. One consistent ledger.
            </h2>
            <p className="text-sm text-slate-600">
              Clear accountability, structured records, and end-to-end audit tracking across every transaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pillar 1: Bonuses */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <Award className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900">Merit &amp; Spot Bonuses</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Log performance, festive, and milestone bonuses with mandatory justification and multi-tier approval states.
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Draft → Pending → Approved → Paid</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>₹ INR formatting with tabular alignment</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2: Reviews */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
              <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
                <FileCheck2 className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900">Performance Appraisals</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Structured quarterly and annual reviews across 8 core competencies with weighted scoring and printable scorecards.
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
            <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
              <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                <AlertOctagon className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900">Grievance Escalations</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Confidential incident intake with SLA deadline tracking, severity routing, and anonymous employee reporting.
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Automated SLA clock (4h to 120h)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Internal notes visible only to leads &amp; admins</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Role governance strip */}
      <section id="governance" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Three roles. No overlap.
            </h2>
            <p className="text-sm text-slate-600">
              Every action is gated server-side by role. UI visibility matches API permissions exactly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                role: "Administrator",
                badge: "ADMIN",
                badgeColor: "bg-rose-50 border-rose-200 text-rose-700",
                desc: "Global oversight. Approves bonuses, provisions accounts, reads the full audit ledger, manages system settings.",
              },
              {
                role: "Team Lead",
                badge: "LEAD",
                badgeColor: "bg-amber-50 border-amber-200 text-amber-700",
                desc: "Department scope. Awards bonuses, authors performance reviews, triages and resolves team escalations.",
              },
              {
                role: "Employee",
                badge: "USER",
                badgeColor: "bg-indigo-50 border-indigo-200 text-indigo-700",
                desc: "Self-scope only. Views own bonuses and reviews, acknowledges appraisals, raises confidential complaints.",
              },
            ].map((r) => (
              <div key={r.role} className="bg-white p-6 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-slate-900">{r.role}</div>
                    <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border mt-0.5 ${r.badgeColor}`}>
                      {r.badge}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Security & Audit CTA */}
      <section id="security" className="py-16 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-xs text-indigo-400 font-mono">
            <Lock className="w-3.5 h-3.5" />
            <span>Immutable Append-Only Audit Logging</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Every action is recorded. Nothing is hidden.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Every bonus approval, review submission, and escalation state change writes an append-only audit row with actor, timestamp, and before/after payload.
          </p>
          <div className="pt-2">
            <Link href="/sign-in">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm h-10 px-8 font-semibold shadow-lg">
                Sign in to the console
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="py-7 bg-white border-t border-slate-200 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-indigo-600 text-white flex items-center justify-center text-xs font-mono font-bold">
              P
            </span>
            <span className="font-semibold text-slate-800">Pulse</span>
            <span>· People Operations &amp; Governance</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Next.js 15 App Router</span>
            <span>·</span>
            <span>Neon Serverless DB</span>
            <span>·</span>
            <span>Auth.js v5 RBAC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
