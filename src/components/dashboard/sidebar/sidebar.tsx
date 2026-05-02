"use client";

import { cn } from "@/lib/utils/cn";
import { SidebarNav } from "./sidebar-nav";
import { SidebarUpgradeBanner } from "./sidebar-upgrade-banner";
import { SidebarCollapseToggle } from "./sidebar-collapse-toggle";
import { SidebarFooter } from "./sidebar-footer";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={onClose}
          onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
          role="button"
          tabIndex={-1}
          aria-label="Close sidebar"
        />
      )}

      <aside
        aria-label="Main sidebar"
        className={cn(
          "fixed left-0 top-16 z-30 flex h-[calc(100vh-4rem)] w-64 flex-col border-r border-border/40 bg-white/80 dark:bg-[#061121]/60 backdrop-blur-xl transition-all duration-300 ease-in-out lg:translate-x-0 shadow-sm dark:shadow-[0_8px_30px_rgb(0_0_0/0.6)]",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed && "lg:w-16"
        )}
      >
        <SidebarNav collapsed={collapsed} onClose={onClose} />
        <SidebarUpgradeBanner collapsed={collapsed} />
        <SidebarCollapseToggle collapsed={collapsed} onToggle={onToggleCollapse} />
        <SidebarFooter collapsed={collapsed} />
      </aside>
    </>
  );
}
