export type {
  AdvisoryFormat,
  AdvisoryInput,
  AdvisoryProduct,
  AdvisoryPublisher,
  AdvisoryResolutionType,
  AdvisorySeverity,
  AdvisoryVulnStatus,
  AdvisoryVulnerability,
} from "./types";
export { buildCsaf } from "./csaf";
export { buildCycloneDxVex } from "./cyclonedx-vex";
export {
  toCsafProductStatus,
  toVexState,
  type CsafProductStatus,
  type VexState,
} from "./status-map";

import type { AdvisoryFormat, AdvisoryInput } from "./types";
import { buildCsaf } from "./csaf";
import { buildCycloneDxVex } from "./cyclonedx-vex";

/** Build the advisory object for the requested format. */
export function buildAdvisory(
  format: AdvisoryFormat,
  input: AdvisoryInput,
): Record<string, unknown> {
  return format === "csaf" ? buildCsaf(input) : buildCycloneDxVex(input);
}

/** The download filename stem for a format (no extension). */
export function advisoryFilenameStem(
  format: AdvisoryFormat,
  productName: string,
  generatedAt: string,
): string {
  const slug =
    productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "product";
  const date = generatedAt.slice(0, 10);
  const kind = format === "csaf" ? "csaf-advisory" : "cyclonedx-vex";
  return `${kind}-${slug}-${date}`;
}
