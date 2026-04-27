"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useTransactions,
  useTransactionSummary,
  useMonthlyTrend,
  useDeleteTransaction,
} from "@/hooks/useTransactions";
import { TransactionFormDialog } from "@/components/forms/transaction-form-dialog";
import {
  PeriodSwitcher,
  PeriodNavigator,
  PeriodSummaryBar,
  SearchFilterBar,
  TransactionList,
  CategoryBreakdown,
  ExpenseDonutChart,
  MonthlyTrendChart,
  DailyPatternChart,
} from "@/components/dashboard/transactions";
import { getInitialPeriod, getPeriodRange } from "@/lib/utils/period";
import { useTranslation } from "@/lib/i18n";
import type { PeriodState, PeriodView, Transaction } from "@/types";

export default function TransactionsPage() {
  const { t } = useTranslation();
  // ── State ──
  const [period, setPeriod] = useState<PeriodState>(() => getInitialPeriod("monthly"));
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // ── Derived ──
  const { dateFrom, dateTo } = useMemo(() => getPeriodRange(period), [period]);

  const queryParams = useMemo(
    () => ({
      dateFrom,
      dateTo,
      search: search || undefined,
      category: categoryFilter !== "all" ? categoryFilter : undefined,
      page,
      pageSize: 20,
    }),
    [dateFrom, dateTo, search, categoryFilter, page]
  );

  // ── Queries ──
  const txQuery = useTransactions(queryParams);
  const summaryQuery = useTransactionSummary(dateFrom, dateTo);
  const trendQuery = useMonthlyTrend(12);
  const deleteMutation = useDeleteTransaction();

  // ── Handlers ──
  const handleViewChange = useCallback((view: PeriodView) => {
    setPeriod(() => getInitialPeriod(view));
    setPage(1);
  }, []);

  const handlePeriodChange = useCallback((newPeriod: PeriodState) => {
    setPeriod(newPeriod);
    setPage(1);
  }, []);

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);

  const handleCategoryFilter = useCallback((val: string) => {
    setCategoryFilter(val);
    setPage(1);
  }, []);

  const handleEdit = useCallback((tx: Transaction) => {
    setEditingTx(tx);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteMutation.mutate]
  );

  const handleDialogChange = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingTx(null);
  }, []);

  const handleAddNew = useCallback(() => {
    setEditingTx(null);
    setDialogOpen(true);
  }, []);

  // ── Summary data ──
  const summary = summaryQuery.data;
  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const net = summary?.net ?? 0;

  // ── All transactions for daily chart (from current query) ──
  const allTransactions = txQuery.data?.data ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t.transactions.title}</h1>
        <Button className="gap-2" onClick={handleAddNew}>
          <Plus className="h-4 w-4" />
          {t.transactions.addTransaction}
        </Button>
      </div>

      {/* Period Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PeriodSwitcher value={period.view} onChange={handleViewChange} />
        <PeriodNavigator period={period} onChange={handlePeriodChange} />
      </div>

      {/* Summary Bar */}
      <PeriodSummaryBar
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        net={net}
        isLoading={summaryQuery.isLoading}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: Transaction List */}
        <div className="space-y-4 lg:col-span-2">
          <SearchFilterBar
            search={search}
            onSearchChange={handleSearch}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={handleCategoryFilter}
          />
          <Card>
            <CardContent className="p-4">
              <TransactionList
                data={txQuery.data}
                isLoading={txQuery.isLoading}
                onPageChange={setPage}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Category Breakdown + Donut */}
        <div className="space-y-4">
          <CategoryBreakdown
            title={t.transactions.expenseByCategory}
            stats={summary?.expenseByCategory ?? []}
            total={totalExpense}
            isLoading={summaryQuery.isLoading}
          />
          <ExpenseDonutChart
            stats={summary?.expenseByCategory ?? []}
            isLoading={summaryQuery.isLoading}
          />
          <CategoryBreakdown
            title={t.transactions.incomeByCategory}
            stats={summary?.incomeByCategory ?? []}
            total={totalIncome}
            isLoading={summaryQuery.isLoading}
          />
        </div>
      </div>

      {/* Charts */}
      {(period.view === "monthly" || period.view === "yearly") && (
        <MonthlyTrendChart
          data={trendQuery.data ?? []}
          isLoading={trendQuery.isLoading}
        />
      )}

      {period.view === "monthly" && (
        <DailyPatternChart
          transactions={allTransactions}
          isLoading={txQuery.isLoading}
        />
      )}

      {/* Form Dialog */}
      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        transaction={editingTx}
      />
    </div>
  );
}
