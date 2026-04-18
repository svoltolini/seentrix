"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "@/lib/utils";

/**
 * FieldHelp — inline popover trigger for contextual field guidance.
 *
 * Sits next to a form label as a small "?" pill. Clicking or focusing opens a
 * popover with a title, a 1-3 sentence explanation, and an optional CRA
 * reference line so users learn both the system AND the regulation at the
 * exact moment they need it.
 *
 * Use whenever a field's meaning isn't obvious from the label alone,
 * especially for fields whose value ends up on a compliance document.
 *
 * Example:
 *   <Label htmlFor="legal_name">
 *     {t("legalName")}
 *     <FieldHelp
 *       title={t("tooltips.legalName.title")}
 *       body={t("tooltips.legalName.body")}
 *       reference={t("tooltips.legalName.ref")}
 *     />
 *   </Label>
 *
 * Keyboard: Tab to the trigger, Enter/Space to open. Escape closes.
 * Mobile: click to open (no hover), click outside to close.
 */
export function FieldHelp({
  title,
  body,
  reference,
  className,
  side = "top",
}: {
  title: string;
  body: React.ReactNode;
  reference?: string;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        type="button"
        className={cn(
          "inline-flex size-[14px] shrink-0 items-center justify-center rounded-full bg-muted-foreground/15 text-[10px] font-bold leading-none text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[popup-open]:bg-primary/15 data-[popup-open]:text-primary",
          className,
        )}
        aria-label={title}
      >
        ?
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          side={side}
          sideOffset={8}
          align="start"
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup className="z-50 w-80 max-w-[calc(100vw-2rem)] origin-(--transform-origin) rounded-xl border border-white/[0.08] bg-popover p-4 text-popover-foreground shadow-xl shadow-black/20 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <div className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              {body}
            </div>
            {reference && (
              <div className="mt-3 flex items-start gap-2 rounded-md bg-[#D97706]/10 px-2.5 py-2">
                <span className="mt-[2px] size-1.5 shrink-0 rounded-full bg-[#D97706]" />
                <p className="text-[11px] leading-relaxed text-[#D97706]">
                  {reference}
                </p>
              </div>
            )}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
