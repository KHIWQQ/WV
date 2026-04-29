import { cache } from "react";
import { getNetWorthHistory } from "@/lib/actions/dashboard";
import { NetWorthChart } from "@/components/dashboard/net-worth-chart";

const fetchHistory = cache(getNetWorthHistory);

export async function NetWorthSection() {
  const history = await fetchHistory();
  return <NetWorthChart data={history} />;
}
