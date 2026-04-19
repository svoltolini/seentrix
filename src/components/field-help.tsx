"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import { HelpSheet } from "@/components/help-sheet";
import { HugeIcon } from "@/components/huge-icon";
import type {
  AcademyLessonId,
  GlossaryTermId,
} from "@/lib/glossary";
import { useTranslations } from "next-intl";

/**
 * FieldHelp — inline trigger for contextual field guidance.
 *
 * Sits next to a form label as a small "?" pill. Clicking opens a side sheet
 * (slides from the right, bottom on mobile) with:
 *   - the title + body
 *   - a gradient CRA-reference callout (optional)
 *   - related glossary terms as chips (optional) — clicking one opens that
 *     term's sheet
 *   - an Academy lesson CTA (optional, "Coming soon" for now)
 *
 * The API is string-in / JSX-out so translations stay flat and locale-aware.
 * Pass body as a plain string; use the "tip" helpers inside screens to fetch
 * title/body/ref from a translation file under a `tooltips.<key>.*`
 * namespace.
 *
 * Example:
 *   <Label htmlFor="legal_name">
 *     {t("legalName")}
 *     <FieldHelp {...tip("legalName")} />
 *   </Label>
 */
export function FieldHelp({
  title,
  body,
  reference,
  relatedTerms,
  academyLessonId,
  className,
}: {
  title: string;
  body: React.ReactNode;
  reference?: React.ReactNode;
  relatedTerms?: GlossaryTermId[];
  academyLessonId?: AcademyLessonId;
  className?: string;
}) {
  const t = useTranslations("help");
  return (
    <HelpSheet
      eyebrow={t("fieldHelp")}
      title={title}
      body={body}
      reference={reference}
      relatedTerms={relatedTerms}
      academyLessonId={academyLessonId}
    >
      <SheetPrimitive.Trigger
        type="button"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[popup-open]:text-primary",
          className,
        )}
        aria-label={title}
      >
        <HugeIcon name="bubble-chat-question-stroke-rounded" size={15} />
      </SheetPrimitive.Trigger>
    </HelpSheet>
  );
}
