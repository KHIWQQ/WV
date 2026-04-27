"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PeriodView } from "@/types";
import { useTranslation } from "@/lib/i18n";

interface PeriodSwitcherProps {
  value: PeriodView;
  onChange: (view: PeriodView) => void;
}

const VIEW_KEYS: { value: PeriodView; labelKey: "daily" | "monthly" | "yearly" }[] = [
  { value: "daily", labelKey: "daily" },
  { value: "monthly", labelKey: "monthly" },
  { value: "yearly", labelKey: "yearly" },
];

export function PeriodSwitcher({ value, onChange }: PeriodSwitcherProps) {
  const { t } = useTranslation();
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as PeriodView)}>
      <TabsList>
        {VIEW_KEYS.map((v) => (
          <TabsTrigger key={v.value} value={v.value}>
            {t.transactions[v.labelKey]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
