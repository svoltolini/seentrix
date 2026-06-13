/**
 * Build a canonical, machine-readable SBOM (CycloneDX 1.6 or SPDX 2.3) from
 * the components Seentrix has stored for a product, stamped with the
 * manufacturer's supplier metadata.
 *
 * This is the *export* side of the SBOM tab: the platform ingests a
 * customer's SBOM into `sbom_components`, and this re-emits a clean SBOM the
 * manufacturer can attach to the Annex VII technical file or hand to a market
 * surveillance authority on request (CRA Recital 77 / Annex I Part II(1)).
 *
 * Pure + deterministic (caller passes `generatedAt` + `serialNumber`) so it
 * can be unit-tested without I/O.
 */

export type SbomExportFormat = "cyclonedx" | "spdx";

export interface SbomExportComponent {
  name: string;
  version?: string | null;
  purl?: string | null;
  cpe?: string | null;
  license?: string | null;
  supplier?: string | null;
}

export interface SbomExportInput {
  product: { name: string; version?: string | null };
  supplier: { name: string; url?: string | null };
  components: SbomExportComponent[];
  generatedAt: string;
  serialNumber?: string;
}

// A bare SPDX license-id heuristic: a single token of the allowed charset
// (no spaces / operators) is safe to put in `licenseDeclared`; anything else
// (e.g. "MIT License", "GPL or commercial") goes to NOASSERTION + a comment
// so we never emit an invalid SPDX expression.
function looksLikeSpdxId(license: string): boolean {
  return /^[A-Za-z0-9.+-]+$/.test(license);
}

/** Sanitise a string into the SPDXID charset `[0-9a-zA-Z.\-+]`. */
function spdxIdSafe(s: string): string {
  return s.replace(/[^0-9a-zA-Z.\-+]/g, "-");
}

export function buildCycloneDxSbom(
  input: SbomExportInput,
): Record<string, unknown> {
  const components = input.components.map((c, i) => {
    const entry: Record<string, unknown> = {
      type: "library",
      "bom-ref": c.purl ?? `component-${i}`,
      name: c.name,
    };
    if (c.version) entry.version = c.version;
    if (c.purl) entry.purl = c.purl;
    if (c.cpe) entry.cpe = c.cpe;
    if (c.supplier) entry.supplier = { name: c.supplier };
    if (c.license) entry.licenses = [{ license: { name: c.license } }];
    return entry;
  });

  return {
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    ...(input.serialNumber ? { serialNumber: input.serialNumber } : {}),
    version: 1,
    metadata: {
      timestamp: input.generatedAt,
      tools: {
        components: [{ type: "application", name: "Seentrix", version: "1.0" }],
      },
      component: {
        type: "application",
        "bom-ref": "PROD-0",
        name: input.product.name,
        ...(input.product.version ? { version: input.product.version } : {}),
      },
      supplier: {
        name: input.supplier.name,
        ...(input.supplier.url ? { url: [input.supplier.url] } : {}),
      },
      manufacturer: { name: input.supplier.name },
    },
    components,
  };
}

export function buildSpdxSbom(input: SbomExportInput): Record<string, unknown> {
  const created = input.generatedAt;
  const namespaceBase =
    input.supplier.url?.replace(/\/+$/, "") || "https://seentrix.app/spdx";
  const docId = input.serialNumber?.replace("urn:uuid:", "") ?? created;

  const productSpdxId = "SPDXRef-Product";
  const packages: Array<Record<string, unknown>> = [
    {
      name: input.product.name,
      SPDXID: productSpdxId,
      ...(input.product.version
        ? { versionInfo: input.product.version }
        : {}),
      downloadLocation: "NOASSERTION",
      supplier: `Organization: ${input.supplier.name}`,
      licenseConcluded: "NOASSERTION",
      licenseDeclared: "NOASSERTION",
      copyrightText: "NOASSERTION",
    },
  ];

  const relationships: Array<Record<string, unknown>> = [
    {
      spdxElementId: "SPDXRef-DOCUMENT",
      relationshipType: "DESCRIBES",
      relatedSpdxElement: productSpdxId,
    },
  ];

  input.components.forEach((c, i) => {
    const pkgId = `SPDXRef-Package-${i}-${spdxIdSafe(c.name).slice(0, 40)}`;
    const pkg: Record<string, unknown> = {
      name: c.name,
      SPDXID: pkgId,
      ...(c.version ? { versionInfo: c.version } : {}),
      downloadLocation: "NOASSERTION",
      supplier: c.supplier
        ? `Organization: ${c.supplier}`
        : "NOASSERTION",
      licenseConcluded: "NOASSERTION",
      copyrightText: "NOASSERTION",
    };
    if (c.license && looksLikeSpdxId(c.license)) {
      pkg.licenseDeclared = c.license;
    } else {
      pkg.licenseDeclared = "NOASSERTION";
      if (c.license) pkg.licenseComments = `Declared license: ${c.license}`;
    }
    if (c.purl) {
      pkg.externalRefs = [
        {
          referenceCategory: "PACKAGE-MANAGER",
          referenceType: "purl",
          referenceLocator: c.purl,
        },
      ];
    }
    packages.push(pkg);
    relationships.push({
      spdxElementId: productSpdxId,
      relationshipType: "CONTAINS",
      relatedSpdxElement: pkgId,
    });
  });

  return {
    spdxVersion: "SPDX-2.3",
    dataLicense: "CC0-1.0",
    SPDXID: "SPDXRef-DOCUMENT",
    name: `${input.product.name} SBOM`,
    documentNamespace: `${namespaceBase}/sbom/${docId}`,
    creationInfo: {
      created,
      creators: [
        "Tool: Seentrix-1.0",
        `Organization: ${input.supplier.name}`,
      ],
    },
    packages,
    relationships,
  };
}

export function buildSbom(
  format: SbomExportFormat,
  input: SbomExportInput,
): Record<string, unknown> {
  return format === "spdx" ? buildSpdxSbom(input) : buildCycloneDxSbom(input);
}

export function sbomFilenameStem(
  format: SbomExportFormat,
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
  return `${slug}-sbom-${date}`;
}
