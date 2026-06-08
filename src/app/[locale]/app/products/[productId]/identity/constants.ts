/**
 * Phase 5 — product identity, CE marking, simplified DoC.
 */

/** Where the CE marking can be affixed (Art 30). */
export const CE_LOCATIONS = [
  "product",
  "packaging",
  "documentation",
  "website",
] as const;
export type CeLocation = (typeof CE_LOCATIONS)[number];

export function isCeLocation(v: unknown): v is CeLocation {
  return typeof v === "string" && (CE_LOCATIONS as readonly string[]).includes(v);
}

/** Public path for a product's simplified DoC (Annex VI). */
export function simplifiedDocPath(orgSlug: string, productId: string): string {
  return `/doc/${orgSlug}/${productId}`;
}
