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
// HelpSheet — shared side-panel layout used by FieldHelp and Term
//
// Slides in from the right (bottom on mobile) with a gradient CRA-reference
// callout, related-term chips, and an Academy lesson CTA. Trigger is passed
// as children so callers (a "?" pill for FieldHelp, a dotted-underline span
// for Term) can style themselves freely.
// ---------------------------------------------------------------------------

export function HelpSheet({
  eyebrow,
  title,
  body,
  reference,
  relatedTerms,
  academyLessonId,
  children,
}: {
  eyebrow: string;
  title: string;
  body: React.ReactNode;
  reference?: React.ReactNode;
  relatedTerms?: GlossaryTermId[];
  academyLessonId?: AcademyLessonId;
  children: React.ReactNode;
}) {
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

  return (
    <SheetPrimitive.Root>
      {children}
      <SheetPrimitive.Portal>
        <SheetPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <SheetPrimitive.Popup
          data-slot="help-sheet"
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col bg-card text-sm text-card-foreground shadow-2xl shadow-black/40 transition duration-200 ease-in-out sm:max-w-md",
            "data-ending-style:translate-x-[2.5rem] data-ending-style:opacity-0 data-starting-style:translate-x-[2.5rem] data-starting-style:opacity-0",
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-border px-6 pt-6 pb-5">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {eyebrow}
              </p>
              <SheetPrimitive.Title
                data-slot="help-sheet-title"
                className="mt-1 text-h3 text-foreground"
              >
                {title}
              </SheetPrimitive.Title>
            </div>
            <SheetPrimitive.Close
              type="button"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={t("close")}
            >
              <span aria-hidden className="text-lg leading-none">×</span>
            </SheetPrimitive.Close>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="text-[13px] leading-relaxed text-muted-foreground">
              {body}
            </div>

            {reference && (
              <div
                className="relative overflow-hidden rounded-xl bg-cover bg-center p-5"
                style={{ backgroundImage: "url('/images/entity-role-bg.svg')" }}
              >
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                  {t("craReference")}
                </div>
                <p className="text-[13px] leading-relaxed text-white">
                  {reference}
                </p>
              </div>
            )}

            {relatedTerms && relatedTerms.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                className="group block rounded-xl bg-muted p-4 transition-colors hover:bg-muted"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("academy")}
                </p>
                <div className="mt-1 flex items-start justify-between gap-3">
                  <p className="font-heading text-sm font-semibold text-foreground group-hover:text-primary">
                    {lesson.title}
                  </p>
                  <Icon
                    name="arrow-right-01-stroke-rounded"
                    size={14}
                    className="mt-1 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                  />
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{lesson.duration}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="font-medium text-primary">
                    {t("openLesson")}
                  </span>
                </div>
              </Link>
            )}
          </div>
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
        className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-l6-plus text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {children}
      </SheetPrimitive.Trigger>
    </HelpSheet>
  );
}
