"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { GLOSSARY_TERMS, type GlossaryTermId } from "@/lib/glossary";
import { Term } from "@/components/glossary/term";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/icon";

/**
 * Flat A-Z browsable glossary. Search bar filters by title + body text.
 * Each term is rendered as a card — clicking the title opens the same
 * side sheet used everywhere else for inline terms, so the experience is
 * consistent whether the user lands here or discovers a term mid-form.
 */
export function GlossaryIndex() {
  const t = useTranslations("glossary");
  const tMeta = useTranslations("glossary._meta");
  const [query, setQuery] = useState("");

  // Materialise the terms with their translated title + body so the search
  // runs against the user's locale, not the ids.
  const entries = useMemo(() => {
    return GLOSSARY_TERMS.map((id) => ({
      id,
      title: t(`${id}.title`),
      body: t(`${id}.body`),
    })).sort((a, b) => a.title.localeCompare(b.title));
  }, [t]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(needle) ||
        e.body.toLowerCase().includes(needle),
    );
  }, [entries, query]);

  // Group alphabetically so the index reads like a phone book.
  const grouped = useMemo(() => {
    const buckets = new Map<string, typeof filtered>();
    for (const entry of filtered) {
      const letter = entry.title.charAt(0).toUpperCase();
      const list = buckets.get(letter) ?? [];
      list.push(entry);
      buckets.set(letter, list);
    }
    return Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div>
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tMeta("searchPlaceholder")}
          className="h-11 pl-10"
        />
        <Icon
          name="search-02-stroke-rounded"
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
      </div>

      {grouped.length === 0 ? (
        <p className="mt-8 rounded-md bg-muted p-6 text-center text-p3 text-muted-foreground">
          —
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {grouped.map(([letter, items]) => (
            <section key={letter}>
              <h2 className="mb-3 text-l6-plus uppercase tracking-wider text-muted-foreground">
                {letter}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {items.map((entry) => (
                  <GlossaryCard key={entry.id} id={entry.id} title={entry.title} body={entry.body} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function GlossaryCard({
  id,
  title,
  body,
}: {
  id: GlossaryTermId;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-card-sm p-4 transition-colors hover:bg-muted/30">
      <Term id={id} className="text-h5 text-foreground no-underline hover:text-primary">
        {title}
      </Term>
      <p className="mt-1.5 line-clamp-3 text-p3 leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}
