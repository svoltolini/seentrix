import Link from "next/link";
import Image from "next/image";

/**
 * 404 page — global, rendered for any path that doesn't match a route
 * AND for explicit `notFound()` calls inside server components.
 *
 * Centered single-column layout: the new rafiki-style illustration as
 * the hero, then "Page not found" headline + supporting copy + a
 * "Go home" CTA. Replaces the previous bottom-corner plug + socket
 * PNG pair which has been deleted.
 *
 * Lives outside the `[locale]` segment so it catches paths that miss
 * even the locale match. No translations available here for the same
 * reason — copy is hard-coded English (matches the English-only
 * product). next-intl explicitly recommends a locale-less not-found
 * page for this fallback.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 text-center">
      <Image
        src="/illustrations/404.svg"
        alt=""
        width={420}
        height={420}
        className="h-auto w-full max-w-[420px] select-none"
        priority
      />

      <h1 className="mt-8 text-h1 text-foreground">Page not found</h1>
      <p className="mt-3 max-w-md text-p2 text-muted-foreground">
        Sorry, the page you&apos;re looking for doesn&apos;t exist or has
        moved. If you think something is broken, let us know.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-l5 text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go to home
        </Link>
        <Link
          href="/app/dashboard"
          className="inline-flex h-11 items-center justify-center rounded-md border-[1.5px] border-border-outline bg-card px-6 text-l5 text-foreground transition-colors hover:bg-muted"
        >
          Open dashboard
        </Link>
      </div>
    </main>
  );
}
