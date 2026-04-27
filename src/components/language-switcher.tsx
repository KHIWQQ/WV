"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useTranslation,
  LOCALE_LABELS,
  LOCALE_FLAGS,
  type Locale,
} from "@/lib/i18n";

const LOCALES: Locale[] = ["th", "en", "zh"];

export function LanguageSwitcher() {
  const { t, locale, setLocale } = useTranslation();

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:bg-navy-500 hover:text-white transition-colors"
            >
              <Languages className="h-5 w-5" />
              <span className="sr-only">{t.header.language}</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{t.header.language}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setLocale(l)}
            className={locale === l ? "bg-accent" : ""}
          >
            <span className="mr-2 text-xs font-bold text-muted-foreground">
              {LOCALE_FLAGS[l]}
            </span>
            {LOCALE_LABELS[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
