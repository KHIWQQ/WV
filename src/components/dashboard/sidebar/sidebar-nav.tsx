"use client";

import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Sparkles } from "lucide-react";
import { NAV_ITEMS, type NavItem } from "@/lib/utils/constants";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSubscription } from "@/hooks/useSubscription";
import { useAccessControl } from "@/hooks/useAccessControl";
import { SidebarNavItem } from "./sidebar-nav-item";
import { useTranslation } from "@/lib/i18n";

const STAFF_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard/admin", labelKey: "adminSystem", icon: LayoutDashboard },
  { href: "/dashboard/admin/users", labelKey: "userManagement", icon: Users },
  { href: "/dashboard/admin/features", labelKey: "featureFlags", icon: Sparkles },
];

interface SidebarNavProps {
  collapsed: boolean;
  onClose: () => void;
}

export function SidebarNav({ collapsed, onClose }: SidebarNavProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { isPremium, allFeaturesFree } = useSubscription();
  const { isStaff } = useAccessControl();

  return (
    <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto no-scrollbar">
      {!collapsed && (
        <p className="mb-4 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
          {t.nav.mainMenu}
        </p>
      )}
      <TooltipProvider delayDuration={0}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          // Hide the lock icon when the founder has flipped on the
          // "free for all" master switch — gated routes are accessible.
          const isLocked = !!item.isPremium && !isPremium && !allFeaturesFree;

          return (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={isActive}
              isLocked={isLocked}
              isPremium={isPremium}
              collapsed={collapsed}
              onClose={onClose}
            />
          );
        })}

        {isStaff && (
          <>
            <Separator className="my-2 opacity-50" />
            {STAFF_NAV_ITEMS.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                isLocked={false}
                isPremium={isPremium}
                collapsed={collapsed}
                onClose={onClose}
                variant="staff"
              />
            ))}
          </>
        )}
      </TooltipProvider>
    </nav>
  );
}
