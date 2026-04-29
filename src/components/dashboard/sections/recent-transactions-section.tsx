import { cache } from "react";
import { getRecentTransactions } from "@/lib/actions/dashboard";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

const fetchTransactions = cache(getRecentTransactions);

export async function RecentTransactionsSection() {
  // Recent widget shows the latest 10; the same fetch (cached at request scope)
  // is reused by CashflowSection below, which slices the rest.
  const transactions = await fetchTransactions(50);
  return <RecentTransactions transactions={transactions.slice(0, 10)} />;
}
