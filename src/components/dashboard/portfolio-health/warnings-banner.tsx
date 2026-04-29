"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { ConcentrationWarning } from "@/lib/portfolio/health";

interface Props {
  warnings: ConcentrationWarning[];
}

export function WarningsBanner({ warnings }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (warnings.length === 0 || dismissed) return null;

  const primary = warnings[0];
  const rest = warnings.slice(1);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4",
        "shadow-sm"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">
              ตรวจพบการกระจุกตัว{" "}
              <span className="text-amber-600 dark:text-amber-400">
                ({warnings.length} รายการ)
              </span>
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="ปิด"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{primary.message}</p>
        </div>
      </div>

      {rest.length > 0 && (
        <>
          {expanded && (
            <ul className="ml-12 space-y-1.5 border-t border-amber-500/20 pt-3 text-sm text-muted-foreground">
              {rest.map((w, i) => (
                <li key={`${w.kind}-${i}`} className="flex gap-2">
                  <span aria-hidden className="text-amber-500">•</span>
                  <span>{w.message}</span>
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                ย่อ <ChevronUp className="ml-1 h-3 w-3" />
              </>
            ) : (
              <>
                ดูเพิ่ม {rest.length} รายการ <ChevronDown className="ml-1 h-3 w-3" />
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
