"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { formatINR } from "@/lib/money";

interface BonusSpendItem {
  month: string;
  spend: number;
}

interface EscalationTrendItem {
  period: string;
  opened: number;
  resolved: number;
}

export function BonusSpendChart({ data }: { data: BonusSpendItem[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
        No bonus spend recorded in this period.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis
          dataKey="month"
          fontSize={11}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
          stroke="#64748b"
        />
        <YAxis
          fontSize={11}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
          stroke="#64748b"
          tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <Tooltip
          formatter={(val: unknown) => [val != null ? formatINR(Number(val) || 0) : "₹0", "Bonus Spend"]}
          contentStyle={{
            backgroundColor: "#ffffff",
            borderColor: "#e2e8f0",
            color: "#0f172a",
            fontSize: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          }}
        />
        <Bar dataKey="spend" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EscalationVelocityChart({ data }: { data: EscalationTrendItem[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
        No escalation history available.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis
          dataKey="period"
          fontSize={11}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
          stroke="#64748b"
        />
        <YAxis
          fontSize={11}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
          stroke="#64748b"
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            borderColor: "#e2e8f0",
            color: "#0f172a",
            fontSize: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          }}
        />
        <Line type="monotone" dataKey="opened" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} name="Opened" />
        <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Resolved" />
      </LineChart>
    </ResponsiveContainer>
  );
}
