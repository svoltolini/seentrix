"use client";

import { useMemo, type ReactNode } from "react";
import { Term } from "@/components/glossary/term";
import { GLOSSARY_TERMS, type GlossaryTermId } from "@/lib/glossary";

/**
 * Returns a rich-text tag map for next-intl's t.rich, one tag per glossary
 * term. Translations can wrap surface words in `<g-cve>…</g-cve>`,
 * `<g-sbom>…</g-sbom>`, etc. and the rendered output has a dotted-underline
 * <Term> that opens the glossary side sheet.
 *
 * Usage:
 *
 *   const glossary = useGlossaryTags();
 *   <FieldHelp
 *     title={t("tooltips.x.title")}
 *     body={t.rich("tooltips.x.body", glossary)}
 *     reference={t("tooltips.x.ref")}
 *   />
 *
 * The surface word is independent of the term id, so translators can write
 * `<g-doc>Konformitätserklärung</g-doc>` in German without breaking lookup.
 */
export function useGlossaryTags() {
  return useMemo(() => {
    const tags: Record<string, (chunks: ReactNode) => ReactNode> = {};
    for (const id of GLOSSARY_TERMS) {
      tags[`g-${id}`] = (chunks: ReactNode) => (
        <Term id={id as GlossaryTermId}>{chunks}</Term>
      );
    }
    return tags;
  }, []);
}
