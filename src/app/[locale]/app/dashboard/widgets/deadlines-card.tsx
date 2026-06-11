"use client";

/**
 * "Next deadlines" rail card (design handoff §3, `.clay-card.accent`):
 * an accent-soft card listing CRA milestones — title, a mono "Nd"
 * countdown badge, optional blurb, and the full date underneath.
 */

export interface DeadlineItem {
  id: string;
  title: string;
  days: number;
  date: string; // pre-formatted long date
  blurb?: string;
}

export function DeadlinesCard({
  title,
  items,
}: {
  title: string;
  items: DeadlineItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section
      className="rounded-lg p-6"
      style={{
        background: "var(--accent-soft)",
        border: "1px solid color-mix(in srgb, var(--primary) 22%, var(--border))",
      }}
    >
      <h3 className="text-h4 text-foreground">{title}</h3>
      <div className="mt-4 flex flex-col gap-4">
        {items.map((d) => (
          <div key={d.id} className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 rounded-md border border-border bg-card px-2 py-1 font-mono text-[12px] font-semibold tabular-nums text-primary shadow-card-sm">
              {d.days}d
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold leading-snug text-foreground">
                {d.title}
              </p>
              {d.blurb && (
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                  {d.blurb}
                </p>
              )}
              <p className="mt-0.5 font-mono text-[11.5px] text-muted-foreground">
                {d.date}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
