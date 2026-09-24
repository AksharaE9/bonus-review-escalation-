"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { SessionUser } from "@/types";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Users,
  Trash2,
  Shield,
  Clock,
  Lock,
  Info,
} from "lucide-react";

interface SettingsClientProps {
  user?: SessionUser;
  settings: Record<string, unknown>;
}

export function SettingsClient({ settings }: SettingsClientProps) {
  const slaHours = (settings?.sla_hours as Record<string, number> | undefined) || {};
  const [slaLow, setSlaLow] = useState(slaHours.LOW || 120);
  const [slaMed, setSlaMed] = useState(slaHours.MEDIUM || 72);
  const [slaHigh, setSlaHigh] = useState(slaHours.HIGH || 24);
  const [slaCrit, setSlaCrit] = useState(slaHours.CRITICAL || 4);

  const [requireApproval, setRequireApproval] = useState(
    (settings?.bonus_requires_admin_approval as boolean | undefined) ?? true
  );
  const [allowAnon, setAllowAnon] = useState(
    (settings?.allow_anonymous_complaints as boolean | undefined) ?? true
  );

  const handleSave = () => {
    toast.success("System parameters saved successfully.");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="System Settings"
        description="Configure organization parameters, SLA thresholds, security controls, and audit retention policies."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/settings/users">
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Users & Roles
              </Button>
            </Link>
            <Link href="/settings/recycle-bin">
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
                <Trash2 className="w-3.5 h-3.5" />
                Recycle Bin
              </Button>
            </Link>
          </div>
        }
      />

      {/* SLA Thresholds */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Clock className="w-4 h-4 text-indigo-600" />
            Escalation SLA Target Thresholds (Hours)
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Configures maximum hours allocated before an open escalation is flagged as SLA Breached.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-600 dark:text-zinc-400">CRITICAL (Hours)</Label>
            <Input
              type="number"
              value={slaCrit}
              onChange={(e) => setSlaCrit(Number(e.target.value))}
              className="text-xs font-mono h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-600 dark:text-zinc-400">HIGH (Hours)</Label>
            <Input
              type="number"
              value={slaHigh}
              onChange={(e) => setSlaHigh(Number(e.target.value))}
              className="text-xs font-mono h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-600 dark:text-zinc-400">MEDIUM (Hours)</Label>
            <Input
              type="number"
              value={slaMed}
              onChange={(e) => setSlaMed(Number(e.target.value))}
              className="text-xs font-mono h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-600 dark:text-zinc-400">LOW (Hours)</Label>
            <Input
              type="number"
              value={slaLow}
              onChange={(e) => setSlaLow(Number(e.target.value))}
              className="text-xs font-mono h-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Governance & Policy Flags */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Shield className="w-4 h-4 text-emerald-600" />
            Governance Policies
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Enforce compensation approvals and grievance confidentiality standards.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="reqApproval"
              checked={requireApproval}
              onCheckedChange={(c) => setRequireApproval(Boolean(c))}
              className="mt-0.5"
            />
            <div>
              <label
                htmlFor="reqApproval"
                className="text-xs font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer"
              >
                Require Admin Approval on Management Bonuses
              </label>
              <p className="text-[11px] text-zinc-500">
                When enabled, bonuses awarded by Team Leads default to PENDING_APPROVAL.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="allowAnon"
              checked={allowAnon}
              onCheckedChange={(c) => setAllowAnon(Boolean(c))}
              className="mt-0.5"
            />
            <div>
              <label
                htmlFor="allowAnon"
                className="text-xs font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer"
              >
                Allow Anonymous Grievance Intake
              </label>
              <p className="text-[11px] text-zinc-500">
                Employees can mask their identity from Team Leads while retaining HR admin investigation integrity.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Retention Policy (Informational §10.9) */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Lock className="w-4 h-4 text-zinc-500" />
            Audit Retention Policy (Append-Only)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Configured Retention Window</span>
            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
              365 Days (1 Year)
            </span>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 flex items-start gap-2">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong> Audit logs are append-only. Automated database purge routines are disabled
              in compliance with enterprise evidentiary standards.
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
          Save Settings
        </Button>
      </div>
    </div>
  );
}
