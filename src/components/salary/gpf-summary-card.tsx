"use client";

import { Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatTHB } from "@/lib/utils/format";
import type { SalaryGpfSummary } from "@/types";
import { useTranslation } from "@/lib/i18n";

interface GpfSummaryCardProps {
  summary: SalaryGpfSummary | null;
  onEdit: () => void;
}

export function GpfSummaryCard({ summary, onEdit }: GpfSummaryCardProps) {
  const { t } = useTranslation();

  const ownTotal = summary ? summary.own_principal + summary.own_gain : 0;
  const govTotal = summary ? summary.gov_principal + summary.gov_gain : 0;
  const grand = ownTotal + govTotal + (summary?.atb_balance ?? 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{t.salary.gpfTitle}</CardTitle>
            <p className="text-xs text-muted-foreground">{t.salary.gpfSubtitle}</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
            {t.salary.editGpf}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!summary ? (
          <div className="flex h-32 items-center justify-center text-center text-sm text-muted-foreground">
            {t.salary.gpfEmpty}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/60 p-4 text-center">
              <p className="text-xs text-muted-foreground">{t.salary.gpfTotal}</p>
              <p className="text-2xl font-bold tabular-nums">{formatTHB(grand)}</p>
              {summary.as_of && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.salary.asOf} {summary.as_of}
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Portion
                title={t.salary.ownPortion}
                principalLabel={t.salary.principal}
                gainLabel={t.salary.gain}
                subtotalLabel={t.salary.subtotal}
                principal={summary.own_principal}
                gain={summary.own_gain}
              />
              <Portion
                title={t.salary.govPortion}
                principalLabel={t.salary.principal}
                gainLabel={t.salary.gain}
                subtotalLabel={t.salary.subtotal}
                principal={summary.gov_principal}
                gain={summary.gov_gain}
              />
            </div>

            <div className="flex justify-between border-t pt-3 text-sm">
              <span className="text-muted-foreground">{t.salary.atbBalance}</span>
              <span className="font-medium tabular-nums">{formatTHB(summary.atb_balance)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t.salary.linkedAsset}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Portion({
  title,
  principalLabel,
  gainLabel,
  subtotalLabel,
  principal,
  gain,
}: {
  title: string;
  principalLabel: string;
  gainLabel: string;
  subtotalLabel: string;
  principal: number;
  gain: number;
}) {
  return (
    <div className="rounded-lg border p-3 space-y-1.5 text-sm">
      <p className="font-semibold">{title}</p>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{principalLabel}</span>
        <span className="tabular-nums">{formatTHB(principal)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{gainLabel}</span>
        <span className="tabular-nums text-emerald-600 dark:text-emerald-400">{formatTHB(gain)}</span>
      </div>
      <div className="flex justify-between border-t pt-1.5 font-medium">
        <span>{subtotalLabel}</span>
        <span className="tabular-nums">{formatTHB(principal + gain)}</span>
      </div>
    </div>
  );
}
