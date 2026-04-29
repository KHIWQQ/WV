import { cache } from "react";
import { getDashboardAssets } from "@/lib/actions/dashboard";
import { WorldMapClient } from "./world-map-client";

const fetchAssets = cache(getDashboardAssets);

export async function WorldMapSection() {
  const assets = await fetchAssets();
  return <WorldMapClient assets={assets} />;
}
