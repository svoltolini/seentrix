"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { useTranslations } from "next-intl";
import { HelpSheet } from "@/components/help-sheet";
import {
  GLOSSARY_LESSONS,
  GLOSSARY_RELATED,
  type GlossaryTermId,
} from "@/lib/glossary";
import { cn } from "@/lib/utils";

/**
 * Term — inline glossary trigger.
 *
 * Wrap any domain-jargon word in `<Term id="cve">CVE</Term>` and it renders
 * as a dotted-underline span. Clicking or focusing opens the shared help
 * side sheet populated with the glossary entry for that id.
 *
 * Content is read from messages/en|de/glossary.json under
 * `glossary.<id>.{title,body,ref}`. Related-term chips and the Academy
 * lesson link come from the static maps in @/lib/glossary.
 *
 * Use sparingly — no more than 1-2 Terms per sentence so labels don't turn
 * into a sea of dotted underlines.
 */
export function Term({
  id,
  children,
  className,
}: {
  id: GlossaryTermId;
  children?: React.ReactNode;
  className?: string;
}) {
  const tGlossary = useTranslations("glossary");
  const title = tGlossary(`${id}.title`);
  const body = tGlossary(`${id}.body`);

  // Reference is optional per term — not every glossary entry needs one.
  // next-intl throws on missing keys, so catch and fall through.
  let reference: string | undefined;
  try {
    const maybe = tGlossary(`${id}.ref`);
    reference = maybe || undefined;
  } catch {
    reference = undefined;
  }

  const relatedTerms = GLOSSARY_RELATED[id];
  const academyLessonId = GLOSSARY_LESSONS[id] as
    | Parameters<typeof HelpSheet>[0]["academyLessonId"]
    | undefined;

  return (
    <HelpSheet
      eyebrow={tGlossary("_meta.eyebrow")}
      title={title}
      body={body}
      reference={reference}
      relatedTerms={relatedTerms}
      academyLessonId={academyLessonId}
    >
      <SheetPrimitive.Trigger
        type="button"
        className={cn(
          "cursor-help border-0 border-b border-dashed border-current/40 bg-transparent p-0 text-inherit decoration-current/40 underline-offset-[3px] transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className,
        )}
        aria-label={title}
      >
        {children ?? title}
      </SheetPrimitive.Trigger>
    </HelpSheet>
  );
}
