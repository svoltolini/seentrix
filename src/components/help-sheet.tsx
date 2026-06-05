"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/icon";
import { ReferenceCard, ReferenceBadge } from "@/components/reference-card";
import {
  SideSheetBackdrop,
  SideSheetBody,
  SideSheetHero,
  SideSheetFooter,
  SideSheetPopup,
} from "@/components/side-sheet";
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
        <SideSheetBackdrop />
        <SideSheetPopup data-slot="help-sheet">
          <SideSheetHero
            eyebrow={eyebrow}
            title={title}
            description={description}
            closeLabel={t("close")}
          />

          {/* BODY — scrollable content. gap-5 between blocks so optional
              pieces (reference, related terms, academy link) compose
              cleanly without manual margin tuning per call site. */}
          <SideSheetBody>
            {body && (
              <div className="text-p3 leading-relaxed text-muted-foreground">
                {body}
              </div>
            )}

            {reference && (
              // The canonical "CRA Reference" card design — see ReferenceCard.
              <ReferenceCard className="p-5">
                <ReferenceBadge className="mb-2">
                  {t("craReference")}
                </ReferenceBadge>
                <p className="text-p3 leading-relaxed text-primary-foreground">
                  {reference}
                </p>
              </ReferenceCard>
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
          </SideSheetBody>

          {/* FOOTER — optional anchored region for primary CTAs +
              disclosure copy. */}
          {footer && <SideSheetFooter>{footer}</SideSheetFooter>}
        </SideSheetPopup>
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
