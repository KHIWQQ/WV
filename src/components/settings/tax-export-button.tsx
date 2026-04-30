"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { exportTaxBundle } from "@/lib/actions/tax-export";
import { toast } from "@/hooks/useToast";
import { useTranslation } from "@/lib/i18n";

const currentYear = new Date().getFullYear();

export function TaxExportButton() {
  const { t } = useTranslation();
  const [year, setYear] = useState(currentYear - 1);
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const bundle = await exportTaxBundle(year);
      // Browser download via Blob
      const blob = new Blob([bundle.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = bundle.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: t.taxExport.success,
        description: `${bundle.recordCount} ${t.taxExport.records}`,
      });
    } catch (e) {
      toast({
        title: t.common.error,
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{t.taxExport.title}</h3>
        <p className="text-sm text-muted-foreground">{t.taxExport.subtitle}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <Label className="text-xs">{t.taxExport.year}</Label>
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min={2000}
            max={currentYear}
            className="w-32"
          />
        </div>
        <Button onClick={handleExport} disabled={busy} className="gap-2">
          <Download className="h-4 w-4" />
          {busy ? t.taxExport.exporting : t.taxExport.exportCsv}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t.taxExport.note}</p>
    </div>
  );
}
