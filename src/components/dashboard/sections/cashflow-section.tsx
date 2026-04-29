import { cache } from "react";
import { getRecentTransactions } from "@/lib/actions/dashboard";
import { MonthlyCashflowChart } from "@/components/dashboard/monthly-cashflow-chart";

const fetchTransactions = cache(getRecentTransactions);

export async function CashflowSection() {
  const transactions = await fetchTransactions(50);
  return <MonthlyCashflowChart transactions={transactions} />;
}
