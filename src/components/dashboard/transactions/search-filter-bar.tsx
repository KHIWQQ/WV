"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/utils/constants";
import { useTranslation } from "@/lib/i18n";

interface SearchFilterBarProps {
  search: string;
  onSearchChange: (search: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
}

export function SearchFilterBar({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
}: SearchFilterBarProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.transactions.searchTransactions}
          className="pl-9"
        />
      </div>
      <Select
        value={categoryFilter}
        onValueChange={onCategoryFilterChange}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder={t.transactions.allCategories} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.transactions.allCategories}</SelectItem>
          <SelectItem disabled value="_income_header">
            {t.transactions.incomeSection}
          </SelectItem>
          {INCOME_CATEGORIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                {t.incomeCategories[c.labelKey as keyof typeof t.incomeCategories]}
              </span>
            </SelectItem>
          ))}
          <SelectItem disabled value="_expense_header">
            {t.transactions.expenseSection}
          </SelectItem>
          {EXPENSE_CATEGORIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                {t.expenseCategories[c.labelKey as keyof typeof t.expenseCategories]}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
