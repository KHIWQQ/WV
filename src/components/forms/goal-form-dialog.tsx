"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateGoal, useUpdateGoal } from "@/hooks/useGoals";
import { useTranslation } from "@/lib/i18n";
import { GOAL_TYPES, type GoalType } from "@/lib/utils/constants";
import type { Goal } from "@/types/goal";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
}

export function GoalFormDialog({ open, onOpenChange, goal }: Props) {
  const { t } = useTranslation();
  const createMutation = useCreateGoal();
  const updateMutation = useUpdateGoal();
  const isEditing = !!goal;

  const [name, setName] = useState("");
  const [goalType, setGoalType] = useState<GoalType>("other");
  const [targetAmount, setTargetAmount] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [targetDate, setTargetDate] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      if (goal) {
        setName(goal.name);
        setGoalType(goal.goal_type);
        setTargetAmount(goal.target_amount);
        setCurrentAmount(goal.current_amount);
        setTargetDate(goal.target_date ?? "");
        setMonthlyContribution(goal.monthly_contribution);
        setNotes(goal.notes ?? "");
      } else {
        setName("");
        setGoalType("other");
        setTargetAmount(0);
        setCurrentAmount(0);
        setTargetDate("");
        setMonthlyContribution(0);
        setNotes("");
      }
    }
  }, [open, goal]);

  async function handleSubmit() {
    const payload = {
      name,
      goal_type: goalType,
      target_amount: targetAmount,
      current_amount: currentAmount,
      target_date: targetDate || null,
      monthly_contribution: monthlyContribution,
      notes: notes || null,
    };
    try {
      if (goal) {
        await updateMutation.mutateAsync({ id: goal.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch {
      // toast handled by hook
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{isEditing ? t.goals.edit : t.goals.add}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col flex-1 min-h-0 gap-4">
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 -mr-2 pr-2">
            <div className="space-y-2">
              <Label>{t.goals.name}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.goals.nameExample} />
            </div>
            <div className="space-y-2">
              <Label>{t.goals.goalType}</Label>
              <Select value={goalType} onValueChange={(v) => setGoalType(v as GoalType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GOAL_TYPES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {t.goalTypes[g as keyof typeof t.goalTypes]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.goals.targetAmount}</Label>
                <Input type="number" step="any" value={targetAmount} onChange={(e) => setTargetAmount(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>{t.goals.currentAmount}</Label>
                <Input type="number" step="any" value={currentAmount} onChange={(e) => setCurrentAmount(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.goals.targetDate}</Label>
                <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t.goals.monthlyContribution}</Label>
                <Input type="number" step="any" value={monthlyContribution} onChange={(e) => setMonthlyContribution(Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.goals.notes}</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4 shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || !name.trim()}>
              {isPending ? t.common.saving : t.common.save}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
