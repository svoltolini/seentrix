"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { searchProducts } from "@/app/[locale]/app/products/actions";

type Result = {
  id: string;
  name: string;
  type: string | null;
  image_url: string | null;
  cra_category: string | null;
};

/**
 * TopbarSearch — live product quick-search for the app top bar.
 *
 * Debounces the query (220 ms), calls the `searchProducts` server action, and
 * shows a dropdown of matches. Clicking a result (or pressing Enter on the
 * highlighted row) navigates to that product. Replaces the old placeholder
 * `<SearchInput />` that did nothing.
 *
 * Keyboard: ArrowUp/Down move the highlight, Enter opens it, Escape closes.
 * The dropdown closes on outside-click and on navigation.
 */
export function TopbarSearch({ className }: { className?: string }) {
  const t = useTranslations();
  const router = useRouter();

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Result[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [active, setActive] = React.useState(0);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const reqId = React.useRef(0);

  const placeholder =
    t.has("topbar.searchPlaceholder")
      ? t("topbar.searchPlaceholder")
      : "Search products…";

  // Debounced search. A monotonically-increasing request id guards against
  // out-of-order responses (a slow earlier request resolving after a faster
  // later one and clobbering fresher results).
  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqId.current;
    const handle = setTimeout(async () => {
      try {
        const { results } = await searchProducts(q);
        if (reqId.current === id) {
          setResults(results);
          setActive(0);
        }
      } finally {
        if (reqId.current === id) setLoading(false);
      }
    }, 220);
    return () => clearTimeout(handle);
  }, [query]);

  // Close on outside click.
  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function go(result: Result) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/app/products/${result.id}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const sel = results[active];
      if (sel) {
        e.preventDefault();
        go(sel);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = open && query.trim().length >= 1;
  const showNoResults = showDropdown && !loading && results.length === 0;

  return (
    <div ref={rootRef} className={cn("relative h-12 w-full", className)}>
      <Icon
        name="search-02-stroke-rounded"
        size={24}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="search"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls="topbar-search-listbox"
        aria-autocomplete="list"
        autoComplete="off"
        value={query}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => query.trim().length >= 1 && setOpen(true)}
        onKeyDown={onKeyDown}
        className={cn(
          "h-full w-full rounded-md bg-input pl-12 pr-4 text-p3-r text-foreground placeholder:text-muted-foreground border border-border-strong outline-none transition-[border-color] duration-[140ms]",
          "focus-visible:border-primary",
        )}
      />

      {showDropdown && (
        <div
          id="topbar-search-listbox"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-md border border-border-outline bg-card py-1.5 shadow-card-lg"
        >
          {loading && results.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3 text-p3 text-muted-foreground">
              <Icon name="Loader2" className="size-4 animate-spin" />
              {t.has("topbar.searching") ? t("topbar.searching") : "Searching…"}
            </div>
          ) : showNoResults ? (
            <div className="px-4 py-3 text-p3 text-muted-foreground">
              {t.has("topbar.noResults")
                ? t("topbar.noResults")
                : "No products match your search."}
            </div>
          ) : (
            results.map((r, i) => (
              <button
                key={r.id}
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                  i === active ? "bg-muted" : "hover:bg-muted/60",
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-primary">
                  {r.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.image_url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <Icon name="Box" size={18} variant="Bold" />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-p3 text-foreground">
                    {r.name}
                  </span>
                  {(r.type || r.cra_category) && (
                    <span className="truncate text-p4-r text-muted-foreground">
                      {[r.type, r.cra_category].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </span>
                <Icon
                  name="ArrowRight2"
                  size={14}
                  className="shrink-0 text-muted-foreground"
                />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
