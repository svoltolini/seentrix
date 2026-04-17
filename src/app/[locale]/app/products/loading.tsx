function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/[0.04] ${className ?? ""}`}
    />
  );
}

export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-[1120px] space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <Skeleton className="h-8 w-36" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-52 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-card">
        {/* Column headers */}
        <div className="flex items-center border-b border-white/[0.06] px-5 py-2.5">
          <Skeleton className="h-3 w-12 flex-1" />
          <Skeleton className="hidden h-3 w-16 sm:block" />
          <Skeleton className="ml-12 hidden h-3 w-20 md:block" />
          <Skeleton className="ml-12 hidden h-3 w-14 lg:block" />
          <div className="w-6" />
        </div>

        {/* Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-white/[0.04] px-5 py-3.5 last:border-0"
          >
            <Skeleton className="size-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="hidden h-5 w-16 rounded-full sm:block" />
            <div className="ml-6 hidden items-center gap-2.5 md:flex">
              <Skeleton className="h-1.5 w-16 rounded-full" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="ml-6 hidden h-4 w-20 lg:block" />
            <div className="w-6" />
          </div>
        ))}
      </div>
    </div>
  );
}
