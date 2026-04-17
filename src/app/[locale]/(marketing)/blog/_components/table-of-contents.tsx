"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({
  headings,
  title,
}: {
  headings: TocItem[];
  title: string;
}) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -80% 0px" }
    );

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveId(id);
      }
    },
    []
  );

  if (headings.length === 0) return null;

  return (
    <nav>
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      <ul className="relative space-y-1">
        {/* Active indicator line */}
        <div className="absolute bottom-0 left-0 top-0 w-px bg-border/50" />

        {headings.map((h) => (
          <li key={h.id} className="relative">
            {activeId === h.id && (
              <div className="absolute left-0 top-0.5 h-5 w-px bg-primary transition-all duration-200" />
            )}
            <a
              href={`#${h.id}`}
              onClick={(e) => handleClick(e, h.id)}
              className={cn(
                "block py-1 text-[13px] leading-snug transition-colors hover:text-foreground",
                h.level === 3 ? "pl-6" : "pl-4",
                activeId === h.id
                  ? "font-medium text-foreground"
                  : "text-muted-foreground/70"
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
