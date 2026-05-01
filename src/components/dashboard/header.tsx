"use client";

import { Menu, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/stores/useAppStore";
import { signOut } from "@/lib/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationDropdown } from "@/components/dashboard/notification-dropdown";
import { useTranslation } from "@/lib/i18n";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const profile = useAppStore((s) => s.profile);
  const { t } = useTranslation();

  const initials = profile?.display_name
    ?.split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/10 bg-navy/95 backdrop-blur-md px-4 text-white shadow-sm transition-all">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-navy-500 lg:hidden"
          onClick={onToggleSidebar}
          aria-label={t.header.toggleMenu}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 cursor-default">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-gold text-navy shadow-glow">
            <span className="text-xl font-bold">W</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-white/90">
            WealthView
          </span>
          <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-medium text-gold border border-gold/30">
            TH
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <TooltipProvider>
          <LanguageSwitcher />
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <NotificationDropdown />
              </span>
            </TooltipTrigger>
            <TooltipContent>{t.header.notifications}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label={t.header.accountSettings} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 overflow-hidden transition-colors hover:border-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt="Avatar"
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-gradient-gold text-navy text-sm font-bold">
                  {initials}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium truncate">
                {profile?.display_name || t.header.user}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                {t.header.accountSettings}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t.auth.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
