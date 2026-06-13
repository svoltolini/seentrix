/**
 * Build a CycloneDX 1.6 VEX document from a product's triaged
 * vulnerabilities. CycloneDX VEX is a BOM carrying a `vulnerabilities[]`
 * array where each entry's `analysis.state` communicates exploitability.
 *
 * Unlike CSAF, CycloneDX ratings accept a base score + qualitative severity
 * without a full vector, so we surface the CVSS score in machine-readable
 * `ratings` here. Affected components are listed in `components[]` and
 * referenced from each vulnerability's `affects[].ref`.
 */

import type { AdvisoryInput, AdvisoryVulnerability } from "./types";
import { toVexState, vexJustification, vexResponses } from "./status-map";

const PRODUCT_REF = "PROD-0";

function componentKey(v: AdvisoryVulnerability): string {
  return (v.purl ?? `${v.componentName}@${v.componentVersion ?? ""}`).toLowerCase();
}

/** A bom-ref for a component — prefer the purl, else a stable synthetic ref. */
function componentRef(v: AdvisoryVulnerability, index: number): string {
  return v.purl ?? `component-${index}`;
}

export function buildCycloneDxVex(input: AdvisoryInput): Record<string, unknown> {
  // Distinct affected components → components[] + a key→ref lookup.
  const components: Array<Record<string, unknown>> = [];
  const keyToRef = new Map<string, string>();
  for (const v of input.vulnerabilities) {
    const key = componentKey(v);
    if (keyToRef.has(key)) continue;
    const ref = componentRef(v, components.length);
    keyToRef.set(key, ref);
    components.push({
      type: "library",
      "bom-ref": ref,
      name: v.componentName,
      ...(v.componentVersion ? { version: v.componentVersion } : {}),
      ...(v.purl ? { purl: v.purl } : {}),
      ...(v.cpe ? { cpe: v.cpe } : {}),
    });
  }

  const vulnerabilities = input.vulnerabilities.map((v) => {
    const ref = keyToRef.get(componentKey(v))!;
    const state = toVexState(v);

    const ratings: Array<Record<string, unknown>> = [];
    if (v.cvssScore != null) {
      ratings.push({
        score: v.cvssScore,
        severity: v.severity,
        method: "CVSSv31",
      });
    }
    if (v.cvssV4Score != null) {
      ratings.push({
        score: v.cvssV4Score,
        severity: v.severity,
        method: "CVSSv4",
      });
    }
    if (ratings.length === 0) {
      // No numeric score — still record the qualitative severity.
      ratings.push({ severity: v.severity, method: "other" });
    }

    const responses = vexResponses(v);
    const detailBits = [
      v.resolutionNotes,
      v.resolvedAt ? `Resolved ${v.resolvedAt.slice(0, 10)}.` : null,
    ].filter(Boolean);

    const analysis: Record<string, unknown> = { state };
    if (state === "not_affected") {
      analysis.justification = vexJustification(v);
    }
    if (responses.length > 0) analysis.response = responses;
    if (detailBits.length > 0) analysis.detail = detailBits.join(" ");

    return {
      "bom-ref": `vuln-${v.cveId}-${ref}`,
      id: v.cveId,
      source: {
        name: "NVD",
        url: `https://nvd.nist.gov/vuln/detail/${v.cveId}`,
      },
      ratings,
      ...(v.description ? { description: v.description } : {}),
      ...(v.discoveryDate ? { published: v.discoveryDate } : {}),
      analysis,
      affects: [{ ref }],
    };
  });

  return {
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    ...(input.serialNumber ? { serialNumber: input.serialNumber } : {}),
    version: 1,
    metadata: {
      timestamp: input.generatedAt,
      tools: {
        components: [
          {
            type: "application",
            name: "Seentrix",
            version: "1.0",
          },
        ],
      },
      component: {
        type: "application",
        "bom-ref": PRODUCT_REF,
        name: input.product.name,
        ...(input.product.version ? { version: input.product.version } : {}),
        ...(input.product.cpe ? { cpe: input.product.cpe } : {}),
        ...(input.product.purl ? { purl: input.product.purl } : {}),
      },
      supplier: {
        name: input.publisher.name,
        ...(input.publisher.namespace
          ? { url: [input.publisher.namespace] }
          : {}),
        ...(input.publisher.contactDetails
          ? { contact: [{ email: input.publisher.contactDetails }] }
          : {}),
      },
    },
    ...(components.length > 0 ? { components } : {}),
    vulnerabilities,
  };
}
