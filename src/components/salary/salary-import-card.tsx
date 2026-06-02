"use client";

import { useRef, useState } from "react";
import { Upload, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useImportSalaryRecords } from "@/hooks/useSalary";
import { useTranslation } from "@/lib/i18n";

const TEMPLATE_HEADERS = ["period", "gross_rta", "income_tiny", "income_sckt", "note"] as const;

interface ParsedRow {
  period: string;
  gross_rta: number;
  income_tiny: number;
  income_sckt: number;
  note?: string;
  deductions: Record<string, number>;
  gov_contrib: Record<string, number>;
  is_backpay: boolean;
}

// Minimal CSV parser: header row + comma split. Quotes are not supported —
// the template uses plain numeric/short-text columns only.
function parseCsv(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => headers.indexOf(name);

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim());
    const rawPeriod = cells[idx("period")] ?? "";
    if (!rawPeriod) continue;
    // Normalise YYYY-MM → YYYY-MM-01 so it lands on a valid date.
    const period = /^\d{4}-\d{2}$/.test(rawPeriod) ? `${rawPeriod}-01` : rawPeriod;
    const num = (name: string) => {
      const pos = idx(name);
      const val = pos >= 0 ? Number(cells[pos]) : 0;
      return Number.isFinite(val) ? val : 0;
    };
    rows.push({
      period,
      gross_rta: num("gross_rta"),
      income_tiny: num("income_tiny"),
      income_sckt: num("income_sckt"),
      note: idx("note") >= 0 ? cells[idx("note")] || undefined : undefined,
      deductions: {},
      gov_contrib: {},
      is_backpay: false,
    });
  }
  return rows;
}

export function SalaryImportCard() {
  const { t } = useTranslation();
  const importMutation = useImportSalaryRecords();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length > 0) {
      importMutation.mutate(rows);
    }
    // Allow re-selecting the same file.
    if (fileRef.current) fileRef.current.value = "";
  }

  function downloadTemplate() {
    const sample = [
      TEMPLATE_HEADERS.join(","),
      "2025-01,52000,8000,5000,ตัวอย่าง",
    ].join("\n");
    const blob = new Blob([`﻿${sample}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "salary-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t.salary.importTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t.salary.importDesc}</p>
        <p className="rounded bg-muted px-3 py-2 font-mono text-xs">{t.salary.importHint}</p>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFile}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            className="gap-2"
            onClick={() => fileRef.current?.click()}
            disabled={importMutation.isPending}
          >
            <Upload className="h-4 w-4" />
            {importMutation.isPending ? t.salary.importing : t.salary.selectFile}
          </Button>
          <Button variant="outline" className="gap-2" onClick={downloadTemplate}>
            <Download className="h-4 w-4" />
            {t.salary.downloadTemplate}
          </Button>
        </div>
        {fileName && <p className="text-xs text-muted-foreground">{fileName}</p>}
      </CardContent>
    </Card>
  );
}
