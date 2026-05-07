"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";

export function OptionCard({
  title,
  description,
  selected,
  onSelect,
  className,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex w-full items-start gap-3 rounded-md border-[1.5px] bg-card px-4 py-3.5 text-left transition-all duration-150",
        selected
          ? "border-primary/40 bg-primary/5"
          : "border-border-outline hover:border-primary/25 hover:bg-muted/40",
        className
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all duration-150",
          selected
            ? "border-primary bg-primary"
            : "border-border-outline group-hover:border-muted-foreground"
        )}
      >
        {selected && (
          <Icon name="CheckIcon" className="size-3 text-primary-foreground" strokeWidth={3} />
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-l6 text-foreground">{title}</span>
        {description && (
          <span className="text-p3 leading-snug text-muted-foreground">{description}</span>
        )}
      </div>
    </button>
  );
}
