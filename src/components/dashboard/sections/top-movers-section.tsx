import { getTopMovers } from "@/lib/actions/dashboard";
import { TopMoversCard } from "./top-movers-card";

/** Server component: fetches movers and hands them to the client renderer. */
export async function TopMoversSection() {
  const data = await getTopMovers(3);
  return <TopMoversCard {...data} />;
}
