"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PeriodState } from "@/types";
import { getPeriodLabel, navigatePeriod } from "@/lib/utils/period";

interface PeriodNavigatorProps {
  period: PeriodState;
  onChange: (period: PeriodState) => void;
}

export function PeriodNavigator({ period, onChange }: PeriodNavigatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange(navigatePeriod(period, -1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[180px] text-center text-sm font-medium">
        {getPeriodLabel(period)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange(navigatePeriod(period, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
