"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { calculateWeightedOverallScore, type SaveReviewInput } from "@/lib/validators/review";
import { saveReviewAction } from "@/server/actions/review";
import {
  Star,
  Plus,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { ReviewType, SessionUser } from "@/types";

interface ReviewComposerClientProps {
  user?: SessionUser;
  employees: Array<{ id: string; fullName: string; employeeCode: string; departmentName?: string | null }>;
  competencies: Array<{ id: string; name: string; description: string | null; weight: string; sortOrder: number }>;
  cycles: Array<{ id: string; name: string; reviewType: ReviewType; startDate: string; endDate: string }>;
  preselectedEmployeeId?: string;
}

export function ReviewComposerClient({
  employees,
  competencies,
  cycles,
  preselectedEmployeeId,
}: ReviewComposerClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form State
  const [employeeId, setEmployeeId] = useState(preselectedEmployeeId || "");
  const [cycleId, setCycleId] = useState(cycles[0]?.id || "");
  const [reviewType, setReviewType] = useState<ReviewType>("HALF_YEARLY");
  const [periodStart, setPeriodStart] = useState("2025-10-01");
  const [periodEnd, setPeriodEnd] = useState("2026-03-31");
  const visibility: "SHARED" | "INTERNAL" = "SHARED";

  // Competency Ratings map { [competencyId]: { score: number, comment: string } }
  const [ratings, setRatings] = useState<Record<string, { score: number; comment: string }>>(() => {
    const initial: Record<string, { score: number; comment: string }> = {};
    for (const c of competencies) {
      initial[c.id] = { score: 4.0, comment: "" };
    }
    return initial;
  });

  // Manual rating override
  const isRatingOverridden = false;
  const manualRating = 4.0;

  // Narrative
  const [summary, setSummary] = useState("");
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");

  // Goals
  const [goals, setGoals] = useState<Array<{ goal: string; targetDate: string }>>([
    { goal: "Lead quarterly technical initiative", targetDate: "2026-06-30" },
  ]);

  // Autosave status
  const [lastAutosave, setLastAutosave] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);

  // Compute overall rating
  const ratingsArray = competencies.map((c) => ({
    competencyId: c.id,
    score: ratings[c.id]?.score ?? 4.0,
  }));
  const computedOverallRating = calculateWeightedOverallScore(ratingsArray, competencies);
  const effectiveRating = isRatingOverridden ? manualRating : computedOverallRating;

  const saveDraftSilently = useCallback(async () => {
    if (!employeeId || summary.trim().length < 5) return;

    const payload: SaveReviewInput = {
      id: draftId || undefined,
      employeeId,
      cycleId: cycleId || null,
      reviewType,
      periodStart,
      periodEnd,
      overallRating: effectiveRating,
      isRatingOverridden,
      summary: summary.trim(),
      strengths: strengths.trim() || null,
      improvements: improvements.trim() || null,
      goals: goals.map((g) => ({ goal: g.goal, targetDate: g.targetDate, completed: false })),
      ratings: competencies.map((c) => ({
        competencyId: c.id,
        score: ratings[c.id]?.score ?? 4.0,
        comment: ratings[c.id]?.comment || null,
      })),
      visibility,
      isDraft: true,
    };

    try {
      const res = await saveReviewAction(payload);
      if (res.success && res.data) {
        setDraftId(res.data.id);
        const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setLastAutosave(timeStr);
      }
    } catch {
      // silent autosave fails quietly
    }
  }, [
    draftId,
    employeeId,
    cycleId,
    reviewType,
    periodStart,
    periodEnd,
    effectiveRating,
    isRatingOverridden,
    summary,
    strengths,
    improvements,
    goals,
    competencies,
    ratings,
    visibility,
  ]);

  // 20-second silent draft autosave
  useEffect(() => {
    if (!employeeId || summary.trim().length < 5) return;

    const timer = setInterval(() => {
      saveDraftSilently();
    }, 20000);

    return () => clearInterval(timer);
  }, [employeeId, summary, saveDraftSilently]);

  const handleScoreChange = (competencyId: string, score: number) => {
    setRatings((prev) => ({
      ...prev,
      [competencyId]: {
        ...prev[competencyId],
        score,
      },
    }));
  };

  const handleCommentChange = (competencyId: string, comment: string) => {
    setRatings((prev) => ({
      ...prev,
      [competencyId]: {
        ...prev[competencyId],
        comment,
      },
    }));
  };

  const addGoalRow = () => {
    setGoals([...goals, { goal: "", targetDate: "2026-06-30" }]);
  };

  const removeGoalRow = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const handleSubmit = async (asDraft: boolean) => {
    if (!employeeId) {
      toast.error("Please select a recipient employee.");
      return;
    }
    if (summary.trim().length < 10) {
      toast.error("Executive summary must be at least 10 characters long.");
      return;
    }

    const payload: SaveReviewInput = {
      id: draftId || undefined,
      employeeId,
      cycleId: cycleId || null,
      reviewType,
      periodStart,
      periodEnd,
      overallRating: effectiveRating,
      isRatingOverridden,
      summary: summary.trim(),
      strengths: strengths.trim() || null,
      improvements: improvements.trim() || null,
      goals: goals
        .filter((g) => g.goal.trim() !== "")
        .map((g) => ({ goal: g.goal, targetDate: g.targetDate, completed: false })),
      ratings: competencies.map((c) => ({
        competencyId: c.id,
        score: ratings[c.id]?.score ?? 4.0,
        comment: ratings[c.id]?.comment || null,
      })),
      visibility,
      isDraft: asDraft,
    };

    startTransition(async () => {
      try {
        const res = await saveReviewAction(payload);
        if (!res.success) {
          toast.error(res.error || "Failed to submit review.");
          return;
        }

        if (asDraft) {
          toast.success("Review draft saved successfully.");
        } else {
          toast.success("Review submitted to employee for acknowledgement (audited)!");
          router.push(`/employees/${employeeId}?tab=reviews`);
        }
      } catch (err: unknown) {
        toast.error(`Error: ${(err as Error).message}`);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <PageHeader
        title="Write Performance Review"
        description="Structured performance evaluation with weighted competency ratings, developmental narrative, and growth goals."
        actions={
          <div className="flex items-center gap-3">
            {lastAutosave && (
              <span className="text-xs text-muted-foreground italic">
                Draft autosaved at {lastAutosave}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSubmit(true)}
              disabled={isPending}
              className="gap-1.5 h-8 text-xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Draft</span>
            </Button>
            <Button
              size="sm"
              onClick={() => handleSubmit(false)}
              disabled={isPending}
              className="gap-1.5 h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Submit Final Review</span>
            </Button>
          </div>
        }
      />

      {/* Section 1: Context */}
      <div className="rounded-[8px] border border-border bg-card p-5 space-y-4">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
            1
          </span>
          <span>Review Context & Employee</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="employeeSelect">Employee Being Reviewed</Label>
            <select
              id="employeeSelect"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="flex h-9 w-full rounded-[4px] border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select an employee...</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName} ({e.employeeCode}) {e.departmentName ? `· ${e.departmentName}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cycleSelect">Review Cycle</Label>
            <select
              id="cycleSelect"
              value={cycleId}
              onChange={(e) => setCycleId(e.target.value)}
              className="flex h-9 w-full rounded-[4px] border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Adhoc / Independent Review</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.reviewType})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reviewTypeSelect">Review Cadence / Type</Label>
            <select
              id="reviewTypeSelect"
              value={reviewType}
              onChange={(e) => setReviewType(e.target.value as ReviewType)}
              className="flex h-9 w-full rounded-[4px] border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="HALF_YEARLY">HALF_YEARLY</option>
              <option value="ANNUAL">ANNUAL</option>
              <option value="QUARTERLY">QUARTERLY</option>
              <option value="MONTHLY">MONTHLY</option>
              <option value="PROBATION">PROBATION</option>
              <option value="PROJECT">PROJECT</option>
              <option value="PIP">PIP</option>
              <option value="ADHOC">ADHOC</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="periodStart">Period Start</Label>
              <Input
                id="periodStart"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="periodEnd">Period End</Label>
              <Input
                id="periodEnd"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Competency Ratings */}
      <div className="rounded-[8px] border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
              2
            </span>
            <span>Competency Ratings (Weighted Scoring)</span>
          </h3>

          {/* Auto Computed Overall Rating Banner */}
          <div className="flex items-center gap-3 rounded-[6px] border border-border bg-muted/30 px-3 py-1.5">
            <span className="text-xs text-muted-foreground font-medium">
              Overall Rating:
            </span>
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
              <span className="font-mono font-bold text-sm text-foreground tabular-nums">
                {effectiveRating.toFixed(1)} / 5.0
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {competencies.map((comp) => {
            const currentScore = ratings[comp.id]?.score ?? 4.0;
            const currentComment = ratings[comp.id]?.comment ?? "";

            return (
              <div
                key={comp.id}
                className="rounded-[6px] border border-border p-3.5 bg-card/60 space-y-2.5 transition-subtle hover:border-zinc-400"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-xs text-foreground">
                        {comp.name}
                      </h4>
                      <Badge variant="outline" className="text-[10px]">
                        Weight: {comp.weight}x
                      </Badge>
                    </div>
                    {comp.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {comp.description}
                      </p>
                    )}
                  </div>

                  {/* 1 to 5 Selector */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleScoreChange(comp.id, val)}
                        className={`h-7 w-8 rounded-[4px] text-xs font-semibold transition-subtle border ${currentScore === val
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "border-input bg-background text-foreground hover:bg-muted"
                          }`}
                      >
                        {val}.0
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  placeholder="Optional context or observations for this competency..."
                  value={currentComment}
                  onChange={(e) => handleCommentChange(comp.id, e.target.value)}
                  className="text-xs h-7"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Narrative */}
      <div className="rounded-[8px] border border-border bg-card p-5 space-y-4">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
            3
          </span>
          <span>Performance Narrative</span>
        </h3>

        {/* Executive Summary */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="summary">Executive Summary (Required, Min 10 characters)</Label>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {summary.length} chars
            </span>
          </div>
          <Textarea
            id="summary"
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Comprehensive assessment of deliverables, ownership, and contribution across this review period..."
            className="text-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            This narrative will be shared with the employee for formal review and acknowledgement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="strengths">Core Strengths & Highlights</Label>
            <Textarea
              id="strengths"
              rows={3}
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="Key accomplishments and standout competencies demonstrated..."
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="improvements">Areas for Growth & Focus</Label>
            <Textarea
              id="improvements"
              rows={3}
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              placeholder="Constructive feedback, technical or behavioral leveling goals..."
              className="text-xs"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Goals Builder */}
      <div className="rounded-[8px] border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
              4
            </span>
            <span>Target Goals & Milestones</span>
          </h3>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addGoalRow}
            className="h-7 text-xs gap-1"
          >
            <Plus className="h-3 w-3" />
            <span>Add Goal</span>
          </Button>
        </div>

        <div className="space-y-2">
          {goals.map((g, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder="Specific growth or delivery objective..."
                value={g.goal}
                onChange={(e) => {
                  const updated = [...goals];
                  updated[index].goal = e.target.value;
                  setGoals(updated);
                }}
                className="flex-1 text-xs h-8"
              />
              <Input
                type="date"
                value={g.targetDate}
                onChange={(e) => {
                  const updated = [...goals];
                  updated[index].targetDate = e.target.value;
                  setGoals(updated);
                }}
                className="w-36 text-xs h-8"
              />
              {goals.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeGoalRow(index)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Submit Actions */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={isPending}
            className="gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Draft</span>
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            disabled={isPending}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Submit Final Review</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
