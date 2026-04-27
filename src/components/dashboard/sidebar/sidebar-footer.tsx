"use client";

import { cn } from "@/lib/utils/cn";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n";

interface SidebarFooterProps {
  collapsed: boolean;
}

export function SidebarFooter({ collapsed }: SidebarFooterProps) {
  const { t } = useTranslation();
  return (
    <div className={cn("p-4", collapsed && "lg:hidden")}>
      <Separator className="mb-4 opacity-50" />
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-navy to-navy-600 p-4 text-white shadow-lg shadow-navy/20">
        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10 blur-xl"></div>
        <p className="relative z-10 text-xs font-bold text-gold tracking-wide">
          WealthView TH
        </p>
        <p className="relative z-10 mt-1.5 text-[11px] font-medium text-white/80">
          {t.sidebar.manageWealthSmart}
        </p>
      </div>
    </div>
  );
}
