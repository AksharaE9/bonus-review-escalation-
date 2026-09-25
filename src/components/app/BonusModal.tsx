"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CreateBonusSchema,
  type CreateBonusInput,
} from "@/lib/validators/bonus";
import { createBonusAction } from "@/server/actions/bonus";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BonusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Array<{ id: string; fullName: string; employeeCode: string; departmentName?: string | null }>;
  preselectedEmployeeId?: string;
  onSuccess?: () => void;
}

export function BonusModal({
  open,
  onOpenChange,
  employees,
  preselectedEmployeeId,
  onSuccess,
}: BonusModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateBonusInput>({
    resolver: zodResolver(CreateBonusSchema),
    defaultValues: {
      employeeId: preselectedEmployeeId || "",
      amount: "",
      currency: "INR",
      bonusType: "PERFORMANCE",
      reason: "",
      periodMonth: new Date().toISOString().slice(0, 7) + "-01",
    },
  });

  const reasonValue = watch("reason") || "";

  const onSubmit = async (values: CreateBonusInput) => {
    try {
      setIsSubmitting(true);
      const res = await createBonusAction(values);
      if (!res.success) {
        toast.error(res.error || "Failed to award bonus.");
        return;
      }

      toast.success("Bonus created successfully (audited)!");
      reset();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      toast.error(`Error: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Award / Nominate Employee Bonus</DialogTitle>
          <DialogDescription>
            Record an operational incentive or spot bonus. Every bonus requires a detailed justification visible to the employee.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {/* Recipient Employee */}
          <div className="space-y-1.5">
            <Label htmlFor="employeeId" className="text-xs font-medium text-foreground">
              Recipient Employee
            </Label>
            <select
              id="employeeId"
              {...register("employeeId")}
              disabled={Boolean(preselectedEmployeeId)}
              className="flex h-9 w-full rounded-[4px] border border-input bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
            >
              <option value="">Select an employee...</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName} ({e.employeeCode}) {e.departmentName ? `· ${e.departmentName}` : ""}
                </option>
              ))}
            </select>
            {errors.employeeId && (
              <p className="text-[11px] text-destructive">{errors.employeeId.message}</p>
            )}
          </div>

          {/* Amount and Type Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs font-medium text-foreground">
                Amount (INR ₹)
              </Label>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-3 text-xs font-medium text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="amount"
                  placeholder="25,000"
                  {...register("amount")}
                  className="pl-8 font-mono text-xs tabular-nums h-9 bg-card"
                />
              </div>
              {errors.amount && (
                <p className="text-[11px] text-destructive">{errors.amount.message}</p>
              )}
            </div>

            {/* Bonus Type */}
            <div className="space-y-1.5">
              <Label htmlFor="bonusType" className="text-xs font-medium text-foreground">
                Bonus Type
              </Label>
              <select
                id="bonusType"
                {...register("bonusType")}
                className="flex h-9 w-full rounded-[4px] border border-input bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="PERFORMANCE">PERFORMANCE</option>
                <option value="SPOT">SPOT</option>
                <option value="REFERRAL">REFERRAL</option>
                <option value="FESTIVE">FESTIVE</option>
                <option value="RETENTION">RETENTION</option>
                <option value="PROJECT">PROJECT</option>
                <option value="MILESTONE">MILESTONE</option>
                <option value="OTHER">OTHER</option>
              </select>
              {errors.bonusType && (
                <p className="text-[11px] text-destructive">{errors.bonusType.message}</p>
              )}
            </div>
          </div>

          {/* Period Month */}
          <div className="space-y-1.5">
            <Label htmlFor="periodMonth" className="text-xs font-medium text-foreground">
              Allocation Period (Month)
            </Label>
            <Input
              id="periodMonth"
              type="date"
              {...register("periodMonth")}
              className="text-xs h-9 bg-card"
            />
          </div>

          {/* Reason Justification */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="reason" className="text-xs font-medium text-foreground">
                Reason / Justification (Min 10 characters)
              </Label>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {reasonValue.length} chars (min 10)
              </span>
            </div>
            <Textarea
              id="reason"
              rows={3}
              placeholder="Explain specifically what this bonus is for — this is visible to the employee on their profile."
              {...register("reason")}
              className="text-xs bg-card resize-none"
            />
            {errors.reason && (
              <p className="text-[11px] text-destructive">{errors.reason.message}</p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Explain specifically what project, contribution, or milestone this bonus rewards.
            </p>
          </div>

          <DialogFooter className="pt-3 border-t border-border mt-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Submit Bonus</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
