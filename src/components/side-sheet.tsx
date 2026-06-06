"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

/**
 * SideSheet — shared primitives for every right-anchored side panel
 * in the signed-in app.
 *
 *   ┌──────────────────────────────────────────────┐
 *   │ HERO  (bg-primary/5 wash)                    │
 *   │   eyebrow (l6+ uppercase, primary)           │
 *   │   title   (h2)                               │
 *   │   description? (p2-r, optional lede line)    │
 *   │   close × (top-right)                        │
 *   ├──────────────────────────────────────────────┤
 *   │ BODY  (scrollable, gap-5 between blocks)     │
 *   ├──────────────────────────────────────────────┤
 *   │ FOOTER  (anchored CTA, optional)             │
 *   └──────────────────────────────────────────────┘
 *
 * The recipe originated in `<HelpSheet />` (the glossary / FieldHelp
 * canonical sheet). When we built `<CreateProductSheet />` for the
 * "+ New Product" affordance the user pointed out it didn't read as
 * the same family — different hero treatment, different title size,
 * missing eyebrow. Extracting the recipe into shared primitives means
 * every side panel in the app can drop into the same shell with two
 * lines of JSX, and we have a single place to evolve the visual
 * language going forward.
 *
 * The four primitives:
 *
 *   - `<SideSheetPopup />`  — the styled Popup container that anchors
 *     to the right edge with the soft slide-in / fade-out transition.
 *     Must be wrapped in a `<SheetPrimitive.Portal />` and rendered
 *     under a `<SheetPrimitive.Root />`.
 *   - `<SideSheetHero />`   — the bg-primary/5 header with eyebrow,
 *     SheetPrimitive.Title, optional SheetPrimitive.Description, and
 *     the close button. Uses base-ui's accessibility wiring so the
 *     title is announced to screen readers automatically.
 *   - `<SideSheetBody />`   — the scrollable content region.
 *   - `<SideSheetFooter />` — the anchored footer for primary CTAs.
 *
 * Composition pattern (see `<CreateProductSheet />` for a real
 * example):
 *
 *   <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
 *     <SheetPrimitive.Portal>
 *       <SideSheetBackdrop />
 *       <SideSheetPopup>
 *         <SideSheetHero eyebrow="..." title="..." />
 *         <SideSheetBody>{body}</SideSheetBody>
 *         <SideSheetFooter>{ctas}</SideSheetFooter>
 *       </SideSheetPopup>
 *     </SheetPrimitive.Portal>
 *   </SheetPrimitive.Root>
 */

export function SideSheetBackdrop() {
  return (
    <SheetPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
  );
}

export function SideSheetPopup({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Popup>) {
  return (
    <SheetPrimitive.Popup
      data-slot="side-sheet"
      className={cn(
        // Matches the Copilot AI sheet width (~845px, ~10% wider than 3xl) so
        // every side panel in the app has the same (roomier) horizontal
        // real estate. Earlier passes used `sm:max-w-md` (448 px) then
        // `2xl` (672 px); 3xl gives forms, detail threads and composers
        // a bit more breathing room.
        "fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col overflow-hidden bg-card text-p3 text-card-foreground shadow-card-lg transition duration-200 ease-in-out sm:max-w-[845px]",
        "data-ending-style:translate-x-[2.5rem] data-ending-style:opacity-0 data-starting-style:translate-x-[2.5rem] data-starting-style:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

export function SideSheetHero({
  eyebrow,
  title,
  description,
  closeLabel,
}: {
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  /** Override for the close button's aria-label (defaults to `help.close`). */
  closeLabel?: string;
}) {
  const t = useTranslations("help");
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border bg-primary/5 px-6 pb-6 pt-7">
      <div className="flex min-w-0 flex-col gap-2">
        <span className="text-l6-plus uppercase tracking-[2.5px] text-primary">
          {eyebrow}
        </span>
        <SheetPrimitive.Title
          data-slot="side-sheet-title"
          className="text-h2 text-foreground"
        >
          {title}
        </SheetPrimitive.Title>
        {description && (
          <SheetPrimitive.Description
            data-slot="side-sheet-description"
            className="text-p2-r leading-relaxed text-muted-foreground"
          >
            {description}
          </SheetPrimitive.Description>
        )}
      </div>
      <SheetPrimitive.Close
        type="button"
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label={closeLabel ?? t("close")}
      >
        <Icon name="cancel-circle-half-dot-stroke-rounded" size={18} />
      </SheetPrimitive.Close>
    </div>
  );
}

export function SideSheetBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="side-sheet-body"
      className={cn("flex-1 space-y-5 overflow-y-auto px-6 py-5", className)}
      {...props}
    />
  );
}

export function SideSheetFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="side-sheet-footer"
      className={cn(
        "border-t border-border bg-card px-6 py-4",
        className,
      )}
      {...props}
    />
  );
}
