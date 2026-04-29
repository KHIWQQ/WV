"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/components/dashboard/skeletons";
import type { Asset } from "@/types";

// Map is heavy (react-simple-maps + d3-scale + topojson). Code-split it
// so the dashboard's initial bundle stays light.
const AssetWorldMap = dynamic(
  () => import("@/components/assets/asset-world-map").then((m) => m.AssetWorldMap),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={400} />,
  }
);

export function WorldMapClient({ assets }: { assets: Asset[] }) {
  return <AssetWorldMap assets={assets} />;
}
