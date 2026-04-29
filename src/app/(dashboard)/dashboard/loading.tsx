import {
  PageHeaderSkeleton,
  StatCardsSkeleton,
  ChartSkeleton,
  ListSkeleton,
} from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatCardsSkeleton />
      <ChartSkeleton height={320} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton height={300} />
        <ListSkeleton rows={5} />
      </div>
      <ChartSkeleton height={400} />
      <ChartSkeleton height={280} />
    </div>
  );
}
