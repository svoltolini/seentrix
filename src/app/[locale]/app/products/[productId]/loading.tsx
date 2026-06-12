import { Skeleton } from "@/components/ui/skeleton";

/**
 * Tab-content skeleton for the product detail routes. Lives at the
 * [productId] level so switching between the 12 product tabs swaps the
 * content area instantly (header + tab row come from the layout and stay
 * put) while the next tab's data streams in — without this, tab clicks
 * froze on the old tab until the server responded.
 */
export default function ProductTabLoading() {
  return (
    <div className="space-y-[18px]">
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] w-full" />
        ))}
      </div>
      <Skeleton className="h-9 w-44" />
      <Skeleton className="h-[340px] w-full" />
    </div>
  );
}
