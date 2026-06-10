import { Skeleton } from "@/components/ui/skeleton";

/**
 * Settings content skeleton. The SettingsLayout (heading + tab bar) stays
 * mounted across tab switches, so this only fills the content area below the
 * tabs — giving instant feedback while the selected tab's server data loads.
 */
export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-card p-6 shadow-card-sm">
        <Skeleton className="h-5 w-40" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg bg-card p-6 shadow-card-sm">
        <Skeleton className="h-5 w-48" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
