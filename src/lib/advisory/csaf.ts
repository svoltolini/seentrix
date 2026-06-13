/**
 * Build a CSAF 2.0 document using the `csaf_vex` profile from a product's
 * triaged vulnerabilities. CSAF (OASIS Common Security Advisory Framework)
 * is the machine-readable advisory format the EU/ENISA ecosystem references.
 *
 * Modelling:
 *   - The product is a full_product_name (PROD-0), with a CPE/PURL helper
 *     where available.
 *   - Each distinct affected dependency is a full_product_name (CSAFPID-n),
 *     bound to the product via a `default_component_of` relationship; the
 *     relationship's product_id ("PROD-0:CSAFPID-n") is what each
 *     vulnerability's product_status references. This is the correct CSAF way
 *     to say "CVE-X affects dependency D as shipped inside product P".
 *
 * We deliberately omit `scores` objects: a schema-valid CSAF CVSS object
 * requires a full vector string, which we don't store. The base score +
 * qualitative severity are surfaced as notes instead, so the document stays
 * valid and honest rather than fabricating a vector.
 */

import type { AdvisoryInput, AdvisoryVulnerability } from "./types";
import {
  csafJustificationLabel,
  csafRemediationCategory,
  toCsafProductStatus,
  type CsafProductStatus,
} from "./status-map";

interface CsafFullProductName {
  product_id: string;
  name: string;
  product_identification_helper?: {
    cpe?: string;
    purl?: string;
  };
}

interface CsafRelationship {
  category: "default_component_of";
  product_reference: string;
  relates_to_product_reference: string;
  full_product_name: CsafFullProductName;
}

const PRODUCT_ID = "PROD-0";

/** Stable key for de-duplicating components across vulnerabilities. */
function componentKey(v: AdvisoryVulnerability): string {
  return (
    v.purl ??
    `${v.componentName}@${v.componentVersion ?? ""}`
  ).toLowerCase();
}

function componentDisplayName(v: AdvisoryVulnerability): string {
  return v.componentVersion
    ? `${v.componentName} ${v.componentVersion}`
    : v.componentName;
}

export function buildCsaf(input: AdvisoryInput): Record<string, unknown> {
  const date = input.generatedAt;

  // ── product_tree: the product + one branch product per distinct component,
  //    plus relationships binding each component into the product. ──
  const productFpn: CsafFullProductName = {
    product_id: PRODUCT_ID,
    name: input.product.version
      ? `${input.product.name} ${input.product.version}`
      : input.product.name,
    ...(input.product.cpe || input.product.purl
      ? {
          product_identification_helper: {
            ...(input.product.cpe ? { cpe: input.product.cpe } : {}),
            ...(input.product.purl ? { purl: input.product.purl } : {}),
          },
        }
      : {}),
  };

  const componentFpns: CsafFullProductName[] = [];
  const relationships: CsafRelationship[] = [];
  // component key → the relationship product_id used in product_status.
  const keyToRelationshipId = new Map<string, string>();

  for (const v of input.vulnerabilities) {
    const key = componentKey(v);
    if (keyToRelationshipId.has(key)) continue;
    const idx = componentFpns.length;
    const componentId = `CSAFPID-${idx}`;
    const relationshipId = `${PRODUCT_ID}:${componentId}`;

    const helper: { cpe?: string; purl?: string } = {};
    if (v.cpe) helper.cpe = v.cpe;
    if (v.purl) helper.purl = v.purl;

    componentFpns.push({
      product_id: componentId,
      name: componentDisplayName(v),
      ...(helper.cpe || helper.purl
        ? { product_identification_helper: helper }
        : {}),
    });

    relationships.push({
      category: "default_component_of",
      product_reference: componentId,
      relates_to_product_reference: PRODUCT_ID,
      full_product_name: {
        product_id: relationshipId,
        name: `${componentDisplayName(v)} as a component of ${productFpn.name}`,
      },
    });

    keyToRelationshipId.set(key, relationshipId);
  }

  // ── vulnerabilities ──
  const vulnerabilities = input.vulnerabilities.map((v) => {
    const relationshipId = keyToRelationshipId.get(componentKey(v))!;
    const csafStatus = toCsafProductStatus(v);

    const product_status: Partial<Record<CsafProductStatus, string[]>> = {
      [csafStatus]: [relationshipId],
    };

    const notes: Array<Record<string, string>> = [];
    if (v.description) {
      notes.push({ category: "description", text: v.description });
    }
    // Severity + base score as a note (see header comment on `scores`).
    const scoreBits = [
      `Severity: ${v.severity}`,
      v.cvssScore != null ? `CVSS v3.1 base score: ${v.cvssScore}` : null,
      v.cvssV4Score != null ? `CVSS v4.0 base score: ${v.cvssV4Score}` : null,
    ].filter(Boolean);
    notes.push({
      category: "other",
      title: "CVSS",
      text: scoreBits.join(" · "),
    });
    if (v.resolutionNotes) {
      notes.push({
        category: csafStatus === "known_not_affected" ? "other" : "summary",
        title:
          csafStatus === "known_not_affected"
            ? "Impact statement"
            : "Analysis",
        text: v.resolutionNotes,
      });
    }

    const entry: Record<string, unknown> = {
      cve: v.cveId,
      notes,
      product_status,
    };

    // Flags carry the not-affected justification (CSAF VEX requirement for
    // a defensible `known_not_affected`).
    if (csafStatus === "known_not_affected") {
      entry.flags = [
        {
          label: csafJustificationLabel(v),
          product_ids: [relationshipId],
        },
      ];
    }

    // Remediations for fixed / mitigated / won't-fix.
    const remediationCategory = csafRemediationCategory(v);
    if (remediationCategory) {
      const details =
        v.resolutionNotes ??
        (remediationCategory === "vendor_fix"
          ? "A fixed version is available."
          : remediationCategory === "mitigation"
            ? "A mitigation is available."
            : "No fix is planned by the vendor.");
      const remediation: Record<string, unknown> = {
        category: remediationCategory,
        details,
        product_ids: [relationshipId],
      };
      if (
        remediationCategory === "vendor_fix" &&
        v.fixedVersions &&
        v.fixedVersions.length > 0
      ) {
        remediation.details = `${details} Fixed in: ${v.fixedVersions.join(", ")}.`;
      }
      entry.remediations = [remediation];
    }

    return entry;
  });

  return {
    document: {
      category: "csaf_vex",
      csaf_version: "2.0",
      title: `${productFpn.name} — Security Advisory`,
      lang: "en",
      publisher: {
        category: "vendor",
        name: input.publisher.name,
        namespace: input.publisher.namespace,
        ...(input.publisher.contactDetails
          ? { contact_details: input.publisher.contactDetails }
          : {}),
      },
      tracking: {
        id: input.trackingId,
        status: "final",
        version: "1",
        initial_release_date: date,
        current_release_date: date,
        generator: {
          date,
          engine: { name: "Seentrix", version: "1.0" },
        },
        revision_history: [
          { number: "1", date, summary: "Initial release." },
        ],
      },
      notes: [
        {
          category: "legal_disclaimer",
          text: "This advisory is provided as-is for informational purposes under the issuer's coordinated vulnerability disclosure policy.",
        },
      ],
    },
    product_tree: {
      full_product_names: [productFpn, ...componentFpns],
      ...(relationships.length > 0 ? { relationships } : {}),
    },
    vulnerabilities,
  };
}
