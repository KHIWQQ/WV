"use client";

import { useTranslation } from "@/lib/i18n";
import { useAutoSync } from "@/hooks/useAutoSync";

export function DashboardTitle() {
  const { t } = useTranslation();
  useAutoSync();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t.dashboard.wealthOverview}</h1>
      <p className="text-sm text-muted-foreground">{t.dashboard.wealthSummary}</p>
    </div>
  );
}
