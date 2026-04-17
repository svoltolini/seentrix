function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/[0.06] ${className ?? ""}`}
    />
  );
}

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-card">
        <div className="border-b border-white/[0.06] px-6 py-4">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-5 px-6 py-5">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-card">
        <div className="border-b border-white/[0.06] px-6 py-4">
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="space-y-5 px-6 py-5">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
