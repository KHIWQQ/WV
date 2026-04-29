"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import type { NavItem } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import { useTranslation } from "@/lib/i18n";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarNavItemProps {
  item: NavItem;
  isActive: boolean;
  isLocked: boolean;
  isPremium: boolean;
  collapsed: boolean;
  onClose: () => void;
  variant?: "default" | "staff";
}

export function SidebarNavItem({
  item,
  isActive,
  isLocked,
  isPremium,
  collapsed,
  onClose,
  variant = "default",
}: SidebarNavItemProps) {
  const { t } = useTranslation();
  const isStaffVariant = variant === "staff";
  const label = t.nav[item.labelKey as keyof typeof t.nav] || item.labelKey;

  const link = (
    <Link
      href={item.href}
      onClick={onClose}
      prefetch
      className={cn(
        "group relative flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isStaffVariant
          ? isActive
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          : isActive
            ? "bg-navy text-white shadow-md shadow-navy/20 dark:bg-primary dark:text-primary-foreground"
            : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        collapsed && "lg:justify-center lg:px-0"
      )}
    >
      <div className="flex items-center gap-3">
        {isStaffVariant ? (
          <ShieldCheck
            className={cn(
              "h-5 w-5 shrink-0 transition-transform duration-200",
              !isActive && "group-hover:scale-110"
            )}
          />
        ) : (
          <item.icon
            className={cn(
              "h-5 w-5 shrink-0 transition-transform duration-200",
              !isActive && "group-hover:scale-110",
              isLocked && "text-muted-foreground/50"
            )}
          />
        )}
        <span
          className={cn(
            collapsed && "lg:hidden",
            isLocked && "text-muted-foreground/80"
          )}
        >
          {label}
        </span>
      </div>
      {!collapsed && isStaffVariant && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
          STAFF
        </span>
      )}
      {!collapsed && !isStaffVariant && item.isPremium && (
        <span
          className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
            isPremium
              ? "bg-gold/10 text-gold border-gold/20"
              : "bg-muted text-muted-foreground border-transparent opacity-70"
          )}
        >
          PRO
        </span>
      )}
      {collapsed && !isStaffVariant && item.isPremium && isPremium && (
        <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-gold"></div>
      )}
    </Link>
  );

  if (collapsed || isLocked) {
    return (
      <Tooltip>
        <TooltipTrigger asChild className={cn(!collapsed && "flex w-full")}>
          {link}
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="ml-2 bg-navy text-white border-0"
        >
          {label} {isLocked && "(Premium)"}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}
