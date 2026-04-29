import { cn } from "@/lib/utils/cn";

function Shimmer({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/60 dark:bg-muted/30",
        className
      )}
      style={style}
    />
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Shimmer className="h-7 w-56" />
      <Shimmer className="h-4 w-80 max-w-[60vw]" />
    </div>
  );
}

export function StatCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border bg-card p-5 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <Shimmer className="h-3 w-24" />
            <Shimmer className="h-9 w-9 rounded-xl" />
          </div>
          <Shimmer className="mt-4 h-8 w-32" />
          <Shimmer className="mt-2 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({
  height = 320,
  title = true,
}: {
  height?: number;
  title?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <Shimmer className="h-5 w-40" />
          <Shimmer className="h-7 w-20 rounded-md" />
        </div>
      )}
      <Shimmer className="w-full" style={{ height }} />
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <Shimmer className="mb-5 h-5 w-44" />
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Shimmer className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-4 w-3/5" />
              <Shimmer className="h-3 w-2/5" />
            </div>
            <Shimmer className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PortfolioHealthSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-card p-5 shadow-sm">
          <Shimmer className="h-5 w-44" />
          <Shimmer className="mt-2 h-3 w-56" />
          <Shimmer className="mt-5 h-9 w-40" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Shimmer className="h-12 rounded-lg" />
            <Shimmer className="h-12 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <Shimmer className="h-5 w-44" />
        <Shimmer className="h-9 w-32 rounded-md" />
      </div>
      <div className="space-y-3">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <Shimmer key={`h-${i}`} className="h-3" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="grid gap-3 border-t pt-3"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <Shimmer key={`r${r}c${c}`} className="h-4" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
