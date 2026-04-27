"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";

interface SidebarCollapseToggleProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function SidebarCollapseToggle({
  collapsed,
  onToggle,
}: SidebarCollapseToggleProps) {
  return (
    <div className="hidden px-4 pb-2 pt-2 lg:block">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-center rounded-xl py-2 text-muted-foreground transition-all duration-200 hover:bg-muted/80 hover:text-foreground"
      >
        {collapsed ? (
          <ChevronsRight className="h-5 w-5 transition-transform hover:scale-110" />
        ) : (
          <ChevronsLeft className="h-5 w-5 transition-transform hover:scale-110" />
        )}
      </button>
    </div>
  );
}
