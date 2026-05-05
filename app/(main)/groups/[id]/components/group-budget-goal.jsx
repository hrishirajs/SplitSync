"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GroupBudgetGoal({ budgetGoal, spentAmount, canEdit, onSave }) {
  const [value, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setValue(
      budgetGoal !== null && budgetGoal !== undefined ? String(budgetGoal) : ""
    );
  }, [budgetGoal]);

  const parsedGoal = Number.parseFloat(value);
  const hasGoal = Number.isFinite(parsedGoal) && parsedGoal > 0;
  const progress = hasGoal ? Math.min(100, (spentAmount / parsedGoal) * 100) : 0;
  const remaining = hasGoal ? parsedGoal - spentAmount : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!onSave) return;

    const goal = Number.parseFloat(value);
    if (!Number.isFinite(goal) || goal <= 0) return;

    try {
      setIsSaving(true);
      await onSave(goal);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">Spent so far</p>
          <p className="mt-1 text-xl font-bold">${spentAmount.toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">Budget goal</p>
          <p className="mt-1 text-xl font-bold">
            {hasGoal ? `$${parsedGoal.toFixed(2)}` : "Not set"}
          </p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">Remaining</p>
          <p className="mt-1 text-xl font-bold">
            {remaining === null
              ? "—"
              : `$${Math.max(0, remaining).toFixed(2)}`}
          </p>
        </div>
      </div>

      {hasGoal && (
        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>{progress.toFixed(0)}% used</span>
            <span>{progress >= 100 ? "Budget reached" : "Within budget"}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${progress >= 100 ? "bg-red-500" : "bg-emerald-500"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {canEdit && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Set a group budget goal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="sm:flex-1"
          />
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save goal"}
          </Button>
        </form>
      )}

      {!canEdit && !hasGoal && (
        <p className="text-sm text-muted-foreground">
          Only the group admin can set a budget goal.
        </p>
      )}
    </div>
  );
}
