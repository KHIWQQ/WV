import {
  PageHeaderSkeleton,
  StatCardsSkeleton,
  ChartSkeleton,
} from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatCardsSkeleton />
      <ChartSkeleton height={360} />
    </div>
  );
}
