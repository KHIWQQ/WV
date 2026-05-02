"use client";

import { useState, useTransition } from "react";
import { Sparkles, Lock, Unlock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";
import { updateAppSettings } from "@/lib/actions/admin-settings";
import {
  PREMIUM_FEATURES,
  PREMIUM_FEATURE_LABELS,
  type AppSettings,
  type PremiumFeature,
} from "@/lib/subscription";
import { cn } from "@/lib/utils/cn";

interface Props {
  initial: AppSettings;
}

export function FeatureFlagsForm({ initial }: Props) {
  const [allFree, setAllFree] = useState(initial.allFeaturesFree);
  const [overrides, setOverrides] = useState<
    Record<PremiumFeature, "free" | "premium">
  >(() => {
    // Default every feature to "premium" (= gated) unless overridden.
    const seed = {} as Record<PremiumFeature, "free" | "premium">;
    for (const f of PREMIUM_FEATURES) {
      seed[f] = initial.featureOverrides[f] ?? "premium";
    }
    return seed;
  });
  const [pending, startTransition] = useTransition();

  function setFeature(feature: PremiumFeature, value: "free" | "premium") {
    setOverrides((prev) => ({ ...prev, [feature]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await updateAppSettings({
          allFeaturesFree: allFree,
          featureOverrides: overrides,
        });
        toast({ title: "บันทึกการตั้งค่าแล้ว" });
      } catch (e) {
        toast({
          title: "บันทึกไม่สำเร็จ",
          description: e instanceof Error ? e.message : undefined,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Master switch */}
      <Card variant="glass">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-amber-500" />
            โหมดฟรีทั้งหมด (Free Promo Mode)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 text-sm text-muted-foreground leading-relaxed">
              <p>
                เปิดสวิตช์นี้เพื่อให้{" "}
                <b className="text-foreground">ทุก feature</b> เปิดให้ใช้ได้ทุกคน
                — ผู้ใช้ฟรีจะใช้พอร์ต / วางแผนเกษียณ / ฯลฯ ได้เหมือน premium
                ทันที (ไม่ต้องรีเฟรชหน้า)
              </p>
              <p className="mt-2 text-xs">
                เหมาะกับช่วงโปรโมชั่นเรียกลูกค้า — ปิดเมื่อพร้อมเริ่มเก็บเงิน
                การตั้งค่า per-feature ด้านล่างจะถูก override ตอนสวิตช์นี้เปิดอยู่
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={allFree}
              onClick={() => setAllFree((v) => !v)}
              className={cn(
                "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                allFree
                  ? "bg-emerald-500 dark:bg-emerald-400"
                  : "bg-input"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition-transform",
                  allFree ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Per-feature overrides */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">ตั้งค่าทีละ feature</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            กำหนดว่า feature ไหน เปิดฟรี / เก็บเป็น premium
            {allFree && (
              <span className="ml-1 text-amber-600 dark:text-amber-400">
                (โหมดฟรีทั้งหมดเปิดอยู่ → ค่าด้านล่างถูก override ทั้งหมด)
              </span>
            )}
          </p>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {PREMIUM_FEATURES.map((f) => {
              const current = overrides[f];
              const isFree = current === "free" || allFree;
              return (
                <li
                  key={f}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isFree ? (
                      <Unlock className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {PREMIUM_FEATURE_LABELS[f]}
                      </p>
                      <p className="truncate text-xs text-muted-foreground font-mono">
                        {f}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1 rounded-lg border border-input p-0.5">
                    <button
                      type="button"
                      onClick={() => setFeature(f, "free")}
                      disabled={allFree}
                      className={cn(
                        "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                        current === "free"
                          ? "bg-emerald-500 text-white dark:bg-emerald-400 dark:text-emerald-950"
                          : "hover:bg-muted",
                        allFree && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      ฟรี
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeature(f, "premium")}
                      disabled={allFree}
                      className={cn(
                        "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                        current === "premium"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted",
                        allFree && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      Premium
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={pending}
          className="gap-2"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          บันทึกการตั้งค่า
        </Button>
      </div>
    </div>
  );
}
