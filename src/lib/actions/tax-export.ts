"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { logAudit } from "@/lib/audit";

export interface TaxExportBundle {
  filename: string;
  csv: string;
  recordCount: number;
}

/**
 * Build a CSV bundle for the user's last full tax year (or year specified)
 * containing assets snapshot + transactions in the period. Caller turns it
 * into a Blob client-side and triggers download.
 *
 * Format is plain CSV with a comment header — readable by Excel and the
 * tax accountant directly. UTF-8 BOM prepended so Thai characters render
 * correctly when opened in Excel.
 */
export async function exportTaxBundle(year?: number): Promise<TaxExportBundle> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const targetYear = year ?? new Date().getFullYear() - 1;
  const yearStart = `${targetYear}-01-01`;
  const yearEnd = `${targetYear + 1}-01-01`;

  const [assetsRes, transactionsRes] = await Promise.all([
    supabase
      .from("assets")
      .select("name, category, currency, quantity, cost_basis, current_value, current_price, country_code, created_at")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("category"),
    supabase
      .from("transactions")
      .select("date, type, category, amount, description")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .gte("date", yearStart)
      .lt("date", yearEnd)
      .order("date"),
  ]);

  if (assetsRes.error) {
    logger.error({ err: assetsRes.error, userId: user.id }, "tax-export: assets query failed");
  }
  if (transactionsRes.error) {
    logger.error({ err: transactionsRes.error, userId: user.id }, "tax-export: transactions query failed");
  }

  const assets = assetsRes.data ?? [];
  const transactions = transactionsRes.data ?? [];

  const lines: string[] = [];
  lines.push(`# WealthView TH — Tax Export`);
  lines.push(`# Tax year: ${targetYear}`);
  lines.push(`# Generated: ${new Date().toISOString()}`);
  lines.push(`# User: ${user.id}`);
  lines.push(``);

  lines.push(`## Assets snapshot (current state)`);
  lines.push(
    csvRow(["Name", "Category", "Currency", "Quantity", "Cost Basis", "Current Value", "Current Price", "Country", "Created"])
  );
  for (const a of assets) {
    lines.push(
      csvRow([
        a.name,
        a.category,
        a.currency || "THB",
        String(a.quantity ?? ""),
        String(a.cost_basis ?? ""),
        String(a.current_value ?? ""),
        String(a.current_price ?? ""),
        a.country_code || "",
        (a.created_at ?? "").split("T")[0],
      ])
    );
  }

  lines.push(``);
  lines.push(`## Transactions (${targetYear})`);
  lines.push(csvRow(["Date", "Type", "Category", "Amount (THB)", "Description"]));
  for (const t of transactions) {
    lines.push(
      csvRow([
        t.date,
        t.type,
        t.category,
        String(t.amount ?? ""),
        t.description ?? "",
      ])
    );
  }

  // Aggregate income / expense / buy / sell totals at the bottom — handy
  // for filling in PND.90 income line items.
  const totals = transactions.reduce(
    (acc, t) => {
      const amt = Number(t.amount) || 0;
      acc[t.type as keyof typeof acc] = (acc[t.type as keyof typeof acc] ?? 0) + amt;
      return acc;
    },
    { income: 0, expense: 0, buy: 0, sell: 0 } as Record<string, number>
  );
  lines.push(``);
  lines.push(`## Summary`);
  lines.push(csvRow(["Type", "Total THB"]));
  for (const [type, amount] of Object.entries(totals)) {
    lines.push(csvRow([type, String(amount)]));
  }

  // BOM helps Excel render Thai characters
  const csv = "﻿" + lines.join("\n");
  const filename = `wealthview-tax-export-${targetYear}.csv`;

  await logAudit("tax-export.create", "tax-export", null, {
    metadata: { year: targetYear, assets: assets.length, transactions: transactions.length },
  });

  return {
    filename,
    csv,
    recordCount: assets.length + transactions.length,
  };
}

function csvRow(cells: string[]): string {
  return cells
    .map((c) => {
      const s = String(c ?? "");
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    })
    .join(",");
}
