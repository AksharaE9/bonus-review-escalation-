"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/app/StatusBadge";
import { SeverityBadge } from "@/components/app/SeverityBadge";
import { MoneyCell } from "@/components/app/MoneyCell";

export default function DevTokensPage() {
  return (
    <div className="min-h-screen bg-background p-8 text-foreground font-sans space-y-8">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Pulse Design System & Token Sheet
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Automated visual verification surface for WCAG AA contrast, semantic badges, typography, and button variants.
        </p>
      </div>

      {/* 1. Button Variants */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            1. Button Hierarchy (4 Canonical Variants)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Button variant="default">Primary (Accent)</Button>
          <Button variant="secondary">Secondary (Border Neutral)</Button>
          <Button variant="ghost">Ghost Action</Button>
          <Button variant="destructive">Destructive Action</Button>
          <Button variant="default" disabled>Disabled State</Button>
        </CardContent>
      </Card>

      {/* 2. Semantic Status Badges */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            2. Semantic Status Mapping & Contrast (WCAG AA Certified)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Bonus Lifecycle
            </h3>
            <div className="flex flex-wrap gap-3">
              <StatusBadge status="DRAFT" />
              <StatusBadge status="PENDING_APPROVAL" />
              <StatusBadge status="APPROVED" />
              <StatusBadge status="REJECTED" />
              <StatusBadge status="PAID" />
              <StatusBadge status="CANCELLED" />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Review Lifecycle
            </h3>
            <div className="flex flex-wrap gap-3">
              <StatusBadge status="SUBMITTED" />
              <StatusBadge status="ACKNOWLEDGED" />
              <StatusBadge status="CLOSED" />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Escalation Severity
            </h3>
            <div className="flex flex-wrap gap-3">
              <SeverityBadge severity="LOW" />
              <SeverityBadge severity="MEDIUM" />
              <SeverityBadge severity="HIGH" />
              <SeverityBadge severity="CRITICAL" />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Escalation Status
            </h3>
            <div className="flex flex-wrap gap-3">
              <StatusBadge status="OPEN" />
              <StatusBadge status="IN_PROGRESS" />
              <StatusBadge status="AWAITING_EMPLOYEE" />
              <StatusBadge status="RESOLVED" />
              <StatusBadge status="WITHDRAWN" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Base Badge Palette */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            3. Core Badge Tokens (Soft Background + Solid Text + 1px Border)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Badge variant="default">Default Accent</Badge>
          <Badge variant="secondary">Neutral Secondary</Badge>
          <Badge variant="outline">Outline Border</Badge>
          <Badge variant="success">Success Emerald</Badge>
          <Badge variant="warning">Warning Amber</Badge>
          <Badge variant="danger">Danger Rose</Badge>
          <Badge variant="info">Info Sky</Badge>
        </CardContent>
      </Card>

      {/* 4. Currency Typography & Numeric Cell Rule */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            4. Currency & Numeric Tabular Typography (Non-Coloured Standard)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 border border-border rounded-[6px] bg-background">
            <span className="text-xs text-muted-foreground block">Spot Disbursal</span>
            <MoneyCell amount={25000} className="text-lg" />
          </div>
          <div className="p-3 border border-border rounded-[6px] bg-background">
            <span className="text-xs text-muted-foreground block">Executive Architecture Merit</span>
            <MoneyCell amount={480000} className="text-lg" />
          </div>
          <div className="p-3 border border-border rounded-[6px] bg-background">
            <span className="text-xs text-muted-foreground block">Zero State Display</span>
            <MoneyCell amount={0} className="text-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
