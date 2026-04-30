"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useGoals, useDeleteGoal } from "@/hooks/useGoals";
import { useTranslation } from "@/lib/i18n";
import { formatTHB, formatPercent } from "@/lib/utils/format";
import { projectGoal } from "@/lib/finance/goal-projection";
import { GoalFormDialog } from "@/components/forms/goal-form-dialog";
import type { Goal } from "@/lib/actions/goals";

export default function GoalsPage() {
  const { t } = useTranslation();
  const { data: goals = [], isLoading } = useGoals();
  const deleteMutation = useDeleteGoal();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  function handleEdit(goal: Goal) {
    setEditingGoal(goal);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditingGoal(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.goals.title}</h1>
          <p className="text-sm text-muted-foreground">{t.goals.subtitle}</p>
        </div>
        <Button className="gap-2" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          {t.goals.add}
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
            {t.common.loading}
          </CardContent>
        </Card>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="flex h-40 items-center justify-center text-muted-foreground">
            {t.goals.empty}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => {
            const projection = projectGoal({
              targetAmount: goal.target_amount,
              currentAmount: goal.current_amount,
              monthlyContribution: goal.monthly_contribution,
              targetDate: goal.target_date,
            });
            const pct = Math.min(projection.progressPct, 100);
            const isComplete = projection.progressPct >= 100;
            return (
              <Card key={goal.id} variant="glass">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <CardTitle className="text-base">{goal.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {t.goalTypes[goal.goal_type as keyof typeof t.goalTypes]}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(goal)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t.common.confirmDelete}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t.common.confirmDeleteMessage} {t.common.cannotBeUndone}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => deleteMutation.mutate(goal.id)}
                            >
                              {t.common.delete}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.goals.progress}</span>
                    <span className="font-semibold tabular-nums">
                      {formatTHB(goal.current_amount)} / {formatTHB(goal.target_amount)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isComplete ? "bg-emerald-500" : "bg-blue-500 dark:bg-blue-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatPercent(projection.progressPct, 1)}
                    {goal.target_date && ` · ${t.goals.targetDate}: ${goal.target_date}`}
                  </p>

                  {projection.recommendedMonthly !== null && projection.recommendedMonthly > 0 && (
                    <div className="rounded-lg bg-muted/40 p-3 text-xs">
                      <p className="text-muted-foreground">
                        {t.goals.recommendedMonthly}
                      </p>
                      <p className="mt-0.5 font-semibold">
                        {formatTHB(projection.recommendedMonthly)}{t.common.perMonth}
                      </p>
                      {projection.onTrack !== null && (
                        <p className={`mt-1 ${projection.onTrack ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                          {projection.onTrack ? t.goals.onTrack : t.goals.behindPace}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <GoalFormDialog open={dialogOpen} onOpenChange={setDialogOpen} goal={editingGoal} />
    </div>
  );
}
