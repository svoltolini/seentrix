import { cn } from "@/lib/utils";

/**
 * Skeleton — a neutral shimmer placeholder used by route `loading.tsx` files
 * so navigation feels instant: Next.js streams the skeleton immediately while
 * the server component fetches its data, instead of leaving the previous page
 * frozen. Uses the muted token + a gentle pulse, matching the design system.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}
