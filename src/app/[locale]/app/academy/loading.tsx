import { Skeleton } from "@/components/ui/skeleton";

export default function AcademyLoading() {
  return (
    <div className="space-y-8">
      {/* Hero card */}
      <Skeleton className="h-44 w-full rounded-md" />
      {/* Tab bar */}
      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28" />
        ))}
      </div>
      {/* Lesson grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full" />
        ))}
      </div>
    </div>
  );
}
