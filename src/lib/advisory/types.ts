/**
 * Shared input types for machine-readable security advisories.
 *
 * Seentrix produces two advisory artifacts from a product's triaged
 * vulnerabilities:
 *   - CSAF 2.0 (the `csaf_vex` profile) — OASIS Common Security Advisory
 *     Framework, the format authorities and the ENISA ecosystem reference.
 *   - CycloneDX VEX — the Vulnerability Exploitability eXchange document,
 *     carried in a CycloneDX BOM.
 *
 * Both consume the same neutral `AdvisoryInput` so the data fetch + status
 * mapping live in one place; the builders only serialise. The builders are
 * pure (no randomness, no I/O) so they can be unit-tested; the caller passes
 * `generatedAt` and `serialNumber`.
 *
 * The CRA hooks here: Annex I Part II(4) requires manufacturers to publicly
 * disclose information about fixed vulnerabilities "accompanied by advisory
 * messages". VEX/CSAF are the machine-readable form of that disclosure.
 */

export type AdvisoryFormat = "csaf" | "cyclonedx-vex";

/** The issuer of the advisory — the manufacturer, in CRA terms. */
export interface AdvisoryPublisher {
  name: string;
  /** A stable URL identifying the issuer (used as the CSAF namespace). */
  namespace: string;
  contactDetails?: string | null;
}

/** The product the advisory is about. */
export interface AdvisoryProduct {
  /** Stable id, used as the base CSAF product_id / CycloneDX bom-ref. */
  id: string;
  name: string;
  version?: string | null;
  cpe?: string | null;
  purl?: string | null;
}

export type AdvisoryVulnStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "accepted";

export type AdvisoryResolutionType =
  | "fix"
  | "mitigation"
  | "false_positive"
  | "wont_fix";

export type AdvisorySeverity = "critical" | "high" | "medium" | "low";

export interface AdvisoryVulnerability {
  cveId: string;
  description?: string | null;
  severity: AdvisorySeverity;
  cvssScore?: number | null;
  cvssV4Score?: number | null;
  status: AdvisoryVulnStatus;
  resolutionType?: AdvisoryResolutionType | null;
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  discoveryDate?: string | null;
  /** The affected component (the vulnerability lives in a dependency). */
  componentName: string;
  componentVersion?: string | null;
  purl?: string | null;
  cpe?: string | null;
  /** Versions of the component that carry the fix, if known. */
  fixedVersions?: string[] | null;
}

export interface AdvisoryInput {
  publisher: AdvisoryPublisher;
  product: AdvisoryProduct;
  /** Document tracking id (CSAF) / advisory reference. */
  trackingId: string;
  /** ISO timestamp; used for release dates + the BOM timestamp. */
  generatedAt: string;
  /** urn:uuid for the CycloneDX serialNumber (caller supplies). */
  serialNumber?: string;
  vulnerabilities: AdvisoryVulnerability[];
}
