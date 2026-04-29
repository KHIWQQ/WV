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
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton height={300} />
        <ChartSkeleton height={300} />
      </div>
    </div>
  );
}
