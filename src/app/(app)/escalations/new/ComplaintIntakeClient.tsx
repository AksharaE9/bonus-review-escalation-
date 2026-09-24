"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createEscalationSchema,
  CreateEscalationInput,
  escCategoryEnumValues,
  escSeverityEnumValues,
} from "@/lib/validators/escalation";
import { createEscalationAction } from "@/server/actions/escalation";
import type { SessionUser } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldAlert, Info, Lock, EyeOff, Loader2 } from "lucide-react";

interface ComplaintIntakeClientProps {
  user: SessionUser;
  employees: Array<{
    id: string;
    fullName: string;
    employeeCode: string;
    departmentName: string | null;
  }>;
  preselectedEmployeeId?: string;
  initialOrigin?: "MANAGEMENT" | "EMPLOYEE";
}

const SEVERITY_GUIDES = {
  LOW: "Minor issues or queries with flexible SLA resolution (5 days / 120h).",
  MEDIUM: "Standard operational matters or team concerns (3 days / 72h).",
  HIGH: "Significant disruption, compliance risk, or behavioral breach (24 hours).",
  CRITICAL: "Severe incident, harassment, security or immediate legal hazard (4 hours).",
};

export function ComplaintIntakeClient({
  user,
  employees,
  preselectedEmployeeId,
  initialOrigin,
}: ComplaintIntakeClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isUserRole = user.role === "USER";
  const defaultOrigin = isUserRole
    ? "EMPLOYEE"
    : initialOrigin || (preselectedEmployeeId ? "MANAGEMENT" : "EMPLOYEE");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateEscalationInput>({
    resolver: zodResolver(createEscalationSchema),
    defaultValues: {
      origin: defaultOrigin,
      subjectEmployeeId: preselectedEmployeeId || null,
      category: "WORKPLACE",
      severity: "MEDIUM",
      title: "",
      description: "",
      isAnonymous: false,
      isConfidential: false,
    },
  });

  const currentSeverity = watch("severity") || "MEDIUM";
  const currentCategory = watch("category");
  const currentOrigin = watch("origin");
  const isAnonymous = watch("isAnonymous");
  const isConfidential = watch("isConfidential");
  const descriptionValue = watch("description") || "";

  const onSubmit = (data: CreateEscalationInput) => {
    startTransition(async () => {
      try {
        const res = await createEscalationAction(data);
        if (res.success) {
          toast.success(
            data.origin === "EMPLOYEE"
              ? "Your grievance/complaint has been submitted securely."
              : "Escalation registered successfully."
          );
          if (data.subjectEmployeeId && user.role !== "USER") {
            router.push(`/employees/${data.subjectEmployeeId}?tab=escalations`);
          } else {
            router.push(`/escalations/${res.data.refCode}`);
          }
        }
      } catch (err: unknown) {
        toast.error((err as Error).message || "Failed to submit escalation");
      }
    });
  };

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none">
      <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50 font-medium">
          <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <CardTitle className="text-xl">
            {isUserRole
              ? "Raise a Complaint or Grievance"
              : currentOrigin === "MANAGEMENT"
              ? "Raise an Escalation Against Employee"
              : "Register Internal Complaint / Concern"}
          </CardTitle>
        </div>
        <CardDescription className="text-zinc-500 dark:text-zinc-400 text-xs">
          {isUserRole
            ? "Submit an official grievance, workplace concern, or operational issue. Every report is audited and tracked against strict SLAs."
            : "Record an official disciplinary, attendance, behavioral, or performance escalation."}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Origin selector for Admin / Lead */}
          {!isUserRole && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Origin Type
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue("origin", "MANAGEMENT")}
                  className={`px-4 py-2.5 rounded text-xs font-medium text-left border transition-colors ${
                    currentOrigin === "MANAGEMENT"
                      ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 dark:bg-indigo-950/30 dark:text-indigo-200 dark:border-indigo-500"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span className="block font-semibold">Management Escalation</span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Raised against a team member / direct report
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue("origin", "EMPLOYEE")}
                  className={`px-4 py-2.5 rounded text-xs font-medium text-left border transition-colors ${
                    currentOrigin === "EMPLOYEE"
                      ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 dark:bg-indigo-950/30 dark:text-indigo-200 dark:border-indigo-500"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span className="block font-semibold">General Complaint / Grievance</span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Workplace, payroll, IT or operational concern
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Subject Employee */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {currentOrigin === "MANAGEMENT"
                ? "Subject Employee *"
                : "Concerns a Specific Employee (Optional)"}
            </Label>
            <Select
              value={watch("subjectEmployeeId") || "none"}
              onValueChange={(val) =>
                setValue("subjectEmployeeId", val === "none" ? null : val)
              }
            >
              <SelectTrigger className="w-full text-xs">
                <SelectValue placeholder="Select employee if applicable..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- None / General Organisation --</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id} className="text-xs">
                    {emp.fullName} ({emp.employeeCode}) {emp.departmentName ? `· ${emp.departmentName}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subjectEmployeeId && (
              <p className="text-[11px] text-rose-600">{errors.subjectEmployeeId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Category *
              </Label>
              <Select
                value={currentCategory}
                onValueChange={(val: string) => setValue("category", val as import("@/types").EscalationCategory)}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {escCategoryEnumValues.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Severity */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Severity Level *
              </Label>
              <Select
                value={currentSeverity}
                onValueChange={(val: string) => setValue("severity", val as import("@/types").EscalationSeverity)}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {escSeverityEnumValues.map((sev) => (
                    <SelectItem key={sev} value={sev} className="text-xs">
                      {sev}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Severity Guide Callout */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                {currentSeverity} SLA:{" "}
              </span>
              {SEVERITY_GUIDES[currentSeverity as keyof typeof SEVERITY_GUIDES]}
            </div>
          </div>

          {/* Title / Subject */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Subject Line / Title *
            </Label>
            <Input
              {...register("title")}
              placeholder="e.g. Repeated late attendance on client delivery, or AC leakage in 3rd floor bay"
              className="text-xs"
            />
            {errors.title && (
              <p className="text-[11px] text-rose-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Detailed Description * (min 10 characters)
              </Label>
              <span
                className={`text-[10px] ${
                  descriptionValue.trim().length < 10
                    ? "text-rose-500 font-medium"
                    : "text-zinc-400"
                }`}
              >
                {descriptionValue.trim().length}/10 min chars
              </span>
            </div>
            <Textarea
              {...register("description")}
              rows={5}
              placeholder="Provide a clear, factual account of what happened, relevant dates, any witnesses or impacted parties, and steps already attempted..."
              className="text-xs resize-none"
            />
            {errors.description && (
              <p className="text-[11px] text-rose-600">{errors.description.message}</p>
            )}
          </div>

          {/* Confidentiality & Anonymity Controls */}
          <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-start gap-3 p-3 rounded bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800">
              <Checkbox
                id="isAnonymous"
                checked={isAnonymous}
                onCheckedChange={(c) => setValue("isAnonymous", Boolean(c))}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <label
                  htmlFor="isAnonymous"
                  className="text-xs font-medium text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <EyeOff className="w-3.5 h-3.5 text-zinc-500" />
                  Submit Anonymously
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Hides your name and employee ID from Department Team Leads. Administrators retain
                  system visibility strictly for lawful audit and investigation integrity.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800">
              <Checkbox
                id="isConfidential"
                checked={isConfidential}
                onCheckedChange={(c) => setValue("isConfidential", Boolean(c))}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <label
                  htmlFor="isConfidential"
                  className="text-xs font-medium text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-zinc-500" />
                  Mark as Confidential (Executive / HR Only)
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Restricts record visibility exclusively to System Administrators and yourself.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              disabled={isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Submitting...
                </>
              ) : isUserRole ? (
                "Submit Complaint"
              ) : (
                "Register Escalation"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
