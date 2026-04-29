import { cache } from "react";
import { getDashboardAssets } from "@/lib/actions/dashboard";
import { AssetAllocationChart } from "@/components/dashboard/asset-allocation-chart";

const fetchAssets = cache(getDashboardAssets);

export async function AllocationSection() {
  const assets = await fetchAssets();
  return <AssetAllocationChart assets={assets} />;
}
