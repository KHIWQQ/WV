import {
  PageHeaderSkeleton,
  StatCardsSkeleton,
  ListSkeleton,
} from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatCardsSkeleton />
      <ListSkeleton rows={6} />
    </div>
  );
}
