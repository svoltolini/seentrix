"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { useCurrentLessonId } from "@/lib/academy/current-lesson-context";
import {
  ACADEMY_LESSONS,
  type AcademyLessonId,
  type GlossaryTermId,
} from "@/lib/glossary";

// ---------------------------------------------------------------------------
// HelpSheet — the canonical side-panel layout for the whole app.
//
// Slides in from the right (bottom on mobile). Composed of three regions:
//
//   ┌──────────────────────────────────────────────┐
//   │ HERO  (bg-primary/5)                         │
//   │   eyebrow (l6+ uppercase, primary)           │
//   │   title   (h2)                               │
//   │   description? (p2-r, optional lede line)    │
//   │   close × (top-right)                        │
//   ├──────────────────────────────────────────────┤
//   │ BODY  (scrollable)                           │
//   │   - Free-form `body` content                 │
//   │   - Optional CRA-reference callout           │
//   │   - Optional related-term chips              │
//   │   - Optional Academy lesson card             │
//   ├──────────────────────────────────────────────┤
//   │ FOOTER  (optional)                           │
//   │   Anchored CTA + secondary link / disclosure │
//   └──────────────────────────────────────────────┘
//
// Two open modes:
//
//   - **Trigger mode (default)** — pass a `<SheetPrimitive.Trigger>` (or
//     anything wrapped in one) as `children`. The sheet opens on click,
//     base-ui handles the rest. Used by FieldHelp, glossary RelatedTermChip.
//
//   - **Controlled mode** — pass `open` + `onOpenChange` and the parent
//     manages state. `children` is optional in this mode. Used by the
//     Help Centre intro sheet on the sidebar question mark.
//
// Every other side sheet in the app should compose around this primitive
// rather than reaching for the lower-level `Sheet` from `components/ui/`.
// That keeps the visual language (hero wash, title size, close button
// position, footer alignment) unified everywhere.
// ---------------------------------------------------------------------------

interface HelpSheetProps {
  eyebrow: string;
  title: string;
  /** Optional one-line description rendered under the title in the hero. */
  description?: React.ReactNode;
  body?: React.ReactNode;
  reference?: React.ReactNode;
  relatedTerms?: GlossaryTermId[];
  academyLessonId?: AcademyLessonId;
  /** Anchored footer (CTA buttons, disclosure copy). Sticks to the bottom of the panel. */
  footer?: React.ReactNode;
  /** Controlled-mode open state. Omit for trigger-mode. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Trigger element. Required in trigger mode, optional in controlled mode. */
  children?: React.ReactNode;
}

export function HelpSheet({
  eyebrow,
  title,
  description,
  body,
  reference,
  relatedTerms,
  academyLessonId,
  footer,
  open,
  onOpenChange,
  children,
}: HelpSheetProps) {
  const t = useTranslations("help");
  const tGlossary = useTranslations("glossary");

  // If we're already on this lesson's page, suppress the "Open lesson"
  // CTA — it would just re-open the same page the user is reading.
  const currentLessonId = useCurrentLessonId();
  const effectiveLessonId =
    academyLessonId && academyLessonId !== currentLessonId
      ? academyLessonId
      : undefined;
  const lesson = effectiveLessonId ? ACADEMY_LESSONS[effectiveLessonId] : null;

  // base-ui's Dialog.Root accepts `open` + `onOpenChange` for controlled
  // mode, or omitting them for uncontrolled (Trigger handles state).
  const rootProps = open !== undefined ? { open, onOpenChange } : {};

  return (
    <SheetPrimitive.Root {...rootProps}>
      {children}
      <SheetPrimitive.Portal>
        <SheetPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <SheetPrimitive.Popup
          data-slot="help-sheet"
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col overflow-hidden bg-card text-p3 text-card-foreground shadow-card-lg transition duration-200 ease-in-out sm:max-w-md",
            "data-ending-style:translate-x-[2.5rem] data-ending-style:opacity-0 data-starting-style:translate-x-[2.5rem] data-starting-style:opacity-0",
          )}
        >
          {/* HERO — soft primary wash, centralises the "what am I looking
              at" identity (eyebrow / title / lede) at the top of every
              side panel in the app. */}
          <div className="flex items-start justify-between gap-3 border-b border-border bg-primary/5 px-6 pb-6 pt-7">
            <div className="flex min-w-0 flex-col gap-2">
              <span className="text-l6-plus uppercase tracking-[2.5px] text-primary">
                {eyebrow}
              </span>
              <SheetPrimitive.Title
                data-slot="help-sheet-title"
                className="text-h2 text-foreground"
              >
                {title}
              </SheetPrimitive.Title>
              {description && (
                <SheetPrimitive.Description
                  data-slot="help-sheet-description"
                  className="text-p2-r leading-relaxed text-muted-foreground"
                >
                  {description}
                </SheetPrimitive.Description>
              )}
            </div>
            <SheetPrimitive.Close
              type="button"
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={t("close")}
            >
              <Icon name="cancel-circle-half-dot-stroke-rounded" size={18} />
            </SheetPrimitive.Close>
          </div>

          {/* BODY — scrollable content. gap-5 between blocks so optional
              pieces (reference, related terms, academy link) compose
              cleanly without manual margin tuning per call site. */}
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {body && (
              <div className="text-p3 leading-relaxed text-muted-foreground">
                {body}
              </div>
            )}

            {reference && (
              <div
                className="relative overflow-hidden rounded-md p-5"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
                }}
              >
                <div className="mb-2 inline-flex items-center gap-2 rounded-sm bg-white/20 px-2.5 py-0.5 text-l6-plus uppercase tracking-wider text-white backdrop-blur-sm">
                  {t("craReference")}
                </div>
                <p className="text-p3 leading-relaxed text-white">
                  {reference}
                </p>
              </div>
            )}

            {relatedTerms && relatedTerms.length > 0 && (
              <div>
                <p className="mb-2 text-l6-plus uppercase tracking-wider text-muted-foreground">
                  {t("relatedTerms")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {relatedTerms.map((termId) => (
                    <RelatedTermChip key={termId} id={termId}>
                      {tGlossary(`${termId}.title`)}
                    </RelatedTermChip>
                  ))}
                </div>
              </div>
            )}

            {lesson && effectiveLessonId && (
              <Link
                href={`/app/academy/${effectiveLessonId}`}
                className="group block rounded-md bg-muted p-4 transition-colors hover:bg-muted/60"
              >
                <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
                  {t("academy")}
                </p>
                <div className="mt-1 flex items-start justify-between gap-3">
                  <p className="text-l5 text-foreground group-hover:text-primary">
                    {lesson.title}
                  </p>
                  <Icon
                    name="arrow-right-01-stroke-rounded"
                    size={14}
                    className="mt-1 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                  />
                </div>
                <div className="mt-2 flex items-center gap-2 text-p4 text-muted-foreground">
                  <span>{lesson.duration}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-l6 text-primary">
                    {t("openLesson")}
                  </span>
                </div>
              </Link>
            )}
          </div>

          {/* FOOTER — optional anchored region for primary CTAs +
              disclosure copy. Sticks below the scrollable body. */}
          {footer && (
            <div className="border-t border-border bg-card px-6 py-4">
              {footer}
            </div>
          )}
        </SheetPrimitive.Popup>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}

// Small internal chip: clicking a related term closes the current sheet and
// opens the target term's sheet. Implemented as a nested HelpSheet so the
// transition reads as "drilling down" — old sheet closes, new one opens.
function RelatedTermChip({
  id,
  children,
}: {
  id: GlossaryTermId;
  children: React.ReactNode;
}) {
  const tGlossary = useTranslations("glossary");
  const title = tGlossary(`${id}.title`);
  const body = tGlossary(`${id}.body`);

  // Reference and lesson are optional per-term; try/catch in case the
  // translation file skipped them for a lighter-weight term.
  let reference: string | undefined;
  try {
    reference = tGlossary(`${id}.ref`);
  } catch {
    reference = undefined;
  }

  return (
    <HelpSheet
      eyebrow={tGlossary("_meta.eyebrow")}
      title={title}
      body={body}
      reference={reference}
      academyLessonId={
        (tGlossary(`${id}.lesson`, {}) as AcademyLessonId) || undefined
      }
    >
      <SheetPrimitive.Trigger
        type="button"
        className="inline-flex items-center gap-1 rounded-sm bg-muted px-2.5 py-1 text-l6-plus text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {children}
      </SheetPrimitive.Trigger>
    </HelpSheet>
  );
}
