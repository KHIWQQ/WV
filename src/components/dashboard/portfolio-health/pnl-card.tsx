"use client";

import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTHB, formatPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useTranslation } from "@/lib/i18n";
import type { AssetMove, PortfolioPnL } from "@/lib/portfolio/health";

interface Props {
  pnl: PortfolioPnL;
}

export function PnLCard({ pnl }: Props) {
  const { t } = useTranslation();
  const isUp = pnl.totalGain > 0;
  const isFlat = pnl.totalGain === 0;
  const tone = isFlat ? "neutral" : isUp ? "positive" : "negative";

  if (pnl.assetCount === 0) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            กำไร/ขาดทุนยังไม่ realize
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t.assets.noAssets} — เริ่มเพิ่มทรัพย์สินเพื่อเห็นข้อมูลกำไร/ขาดทุน
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!pnl.hasCostBasis) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            กำไร/ขาดทุนยังไม่ realize
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            ยังไม่มีทรัพย์สินที่บันทึก cost basis — เพิ่มต้นทุนในรายการเพื่อเห็นกำไร/ขาดทุน
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              กำไร/ขาดทุนยังไม่ realize
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              เทียบต้นทุนรวมกับมูลค่ารวมปัจจุบัน
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 text-navy">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span
            className={cn(
              "text-3xl font-bold tracking-tight",
              tone === "positive" && "text-emerald-500",
              tone === "negative" && "text-red-500",
              tone === "neutral" && "text-foreground"
            )}
          >
            {pnl.totalGain >= 0 ? "+" : ""}
            {formatTHB(pnl.totalGain)}
          </span>
          <span
            className={cn(
              "text-sm font-semibold",
              tone === "positive" && "text-emerald-500",
              tone === "negative" && "text-red-500",
              tone === "neutral" && "text-muted-foreground"
            )}
          >
            {formatPercent(pnl.totalReturnPct)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-muted-foreground">ต้นทุนรวม</p>
            <p className="mt-0.5 font-semibold text-foreground">
              {formatTHB(pnl.totalCost)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-muted-foreground">มูลค่าปัจจุบัน</p>
            <p className="mt-0.5 font-semibold text-foreground">
              {formatTHB(pnl.totalValue)}
            </p>
          </div>
        </div>

        {(pnl.topWinners.length > 0 || pnl.topLosers.length > 0) && (
          <div className="grid gap-3 border-t pt-3 text-xs sm:grid-cols-2">
            <MoveList
              title="ทำกำไรสูงสุด"
              icon={<ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />}
              moves={pnl.topWinners}
              tone="positive"
            />
            <MoveList
              title="ขาดทุนสูงสุด"
              icon={<ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
              moves={pnl.topLosers}
              tone="negative"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MoveList({
  title,
  icon,
  moves,
  tone,
}: {
  title: string;
  icon: React.ReactNode;
  moves: AssetMove[];
  tone: "positive" | "negative";
}) {
  if (moves.length === 0) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span>{title}</span>
        </div>
        <p className="flex items-center gap-1 text-muted-foreground/70">
          <Minus className="h-3 w-3" />
          ยังไม่มี
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span>{title}</span>
      </div>
      <ul className="space-y-1">
        {moves.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-2">
            <span className="truncate text-foreground">{m.name}</span>
            <span
              className={cn(
                "shrink-0 font-semibold tabular-nums",
                tone === "positive" ? "text-emerald-500" : "text-red-500"
              )}
            >
              {formatPercent(m.returnPct)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
