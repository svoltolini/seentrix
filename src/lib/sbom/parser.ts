import { XMLParser } from "fast-xml-parser";

export interface ParsedComponent {
  name: string;
  version: string | null;
  purl: string | null;
  license: string | null;
  supplier: string | null;
}

export type SbomFormat = "cyclonedx" | "spdx";

export interface ParseResult {
  format: SbomFormat;
  components: ParsedComponent[];
}

/**
 * Detect SBOM format from file content.
 * Returns null if the content is not a recognized format.
 */
export function detectFormat(content: string): SbomFormat | null {
  const trimmed = content.trim();

  // JSON-based formats
  if (trimmed.startsWith("{")) {
    try {
      const json = JSON.parse(trimmed);
      if (json.bomFormat === "CycloneDX") return "cyclonedx";
      if (json.spdxVersion) return "spdx";
    } catch {
      return null;
    }
  }

  // XML-based: CycloneDX
  if (trimmed.startsWith("<") && trimmed.includes("cyclonedx")) {
    return "cyclonedx";
  }

  return null;
}

/**
 * Parse an SBOM file and extract components.
 */
export function parseSbom(content: string): ParseResult | null {
  const trimmed = content.trim();
  const format = detectFormat(trimmed);

  if (!format) return null;

  if (format === "spdx") {
    return parseSpdxJson(trimmed);
  }

  // CycloneDX — JSON or XML
  if (trimmed.startsWith("{")) {
    return parseCycloneDxJson(trimmed);
  }

  return parseCycloneDxXml(trimmed);
}

// ---------------------------------------------------------------------------
// CycloneDX JSON
// ---------------------------------------------------------------------------

function parseCycloneDxJson(content: string): ParseResult | null {
  try {
    const bom = JSON.parse(content);
    const raw = Array.isArray(bom.components) ? bom.components : [];

    const components: ParsedComponent[] = raw.map((c: Record<string, unknown>) => ({
      name: String(c.name ?? ""),
      version: c.version ? String(c.version) : null,
      purl: c.purl ? String(c.purl) : null,
      license: extractCycloneDxLicense(c),
      supplier: extractCycloneDxSupplier(c),
    }));

    return { format: "cyclonedx", components };
  } catch {
    return null;
  }
}

function extractCycloneDxLicense(component: Record<string, unknown>): string | null {
  const licenses = component.licenses;
  if (!Array.isArray(licenses) || licenses.length === 0) return null;

  const first = licenses[0] as Record<string, unknown> | undefined;
  if (!first) return null;

  // { license: { id: "MIT" } } or { license: { name: "MIT License" } }
  const lic = first.license as Record<string, unknown> | undefined;
  if (lic?.id) return String(lic.id);
  if (lic?.name) return String(lic.name);

  // { expression: "MIT OR Apache-2.0" }
  if (first.expression) return String(first.expression);

  return null;
}

function extractCycloneDxSupplier(component: Record<string, unknown>): string | null {
  const supplier = component.supplier as Record<string, unknown> | undefined;
  if (supplier?.name) return String(supplier.name);

  // Fall back to publisher
  if (component.publisher) return String(component.publisher);

  return null;
}

// ---------------------------------------------------------------------------
// CycloneDX XML
// ---------------------------------------------------------------------------

function parseCycloneDxXml(content: string): ParseResult | null {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      isArray: (tagName) =>
        ["component", "license"].includes(tagName),
    });
    const doc = parser.parse(content);

    // Navigate to components — can be at bom.components.component
    const bom = doc.bom ?? doc["bom:bom"] ?? doc;
    const componentsWrapper = bom.components ?? {};
    const raw: Record<string, unknown>[] = Array.isArray(componentsWrapper.component)
      ? componentsWrapper.component
      : componentsWrapper.component
        ? [componentsWrapper.component]
        : [];

    const components: ParsedComponent[] = raw.map((c) => {
      let license: string | null = null;
      const licenses = c.licenses as Record<string, unknown> | undefined;
      if (licenses) {
        const licArr = Array.isArray(licenses.license)
          ? licenses.license
          : licenses.license
            ? [licenses.license]
            : [];
        const first = licArr[0] as Record<string, unknown> | undefined;
        if (first) {
          license = first.id ? String(first.id) : first.name ? String(first.name) : null;
        }
      }

      let supplier: string | null = null;
      const sup = c.supplier as Record<string, unknown> | undefined;
      if (sup?.name) supplier = String(sup.name);

      return {
        name: String(c.name ?? ""),
        version: c.version ? String(c.version) : null,
        purl: c.purl ? String(c.purl) : null,
        license,
        supplier,
      };
    });

    return { format: "cyclonedx", components };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// SPDX JSON
// ---------------------------------------------------------------------------

function parseSpdxJson(content: string): ParseResult | null {
  try {
    const doc = JSON.parse(content);
    const packages = Array.isArray(doc.packages) ? doc.packages : [];

    const components: ParsedComponent[] = packages
      .filter((pkg: Record<string, unknown>) => {
        // Skip the document-level package (SPDX root)
        const spdxId = String(pkg.SPDXID ?? "");
        return spdxId !== "SPDXRef-DOCUMENT";
      })
      .map((pkg: Record<string, unknown>) => {
        // Extract PURL from externalRefs
        let purl: string | null = null;
        const refs = Array.isArray(pkg.externalRefs) ? pkg.externalRefs : [];
        for (const ref of refs) {
          const r = ref as Record<string, unknown>;
          if (
            r.referenceType === "purl" ||
            r.referenceType === "PACKAGE-MANAGER" ||
            String(r.referenceLocator ?? "").startsWith("pkg:")
          ) {
            purl = String(r.referenceLocator);
            break;
          }
        }

        // License
        let license: string | null = null;
        if (pkg.licenseConcluded && pkg.licenseConcluded !== "NOASSERTION") {
          license = String(pkg.licenseConcluded);
        } else if (pkg.licenseDeclared && pkg.licenseDeclared !== "NOASSERTION") {
          license = String(pkg.licenseDeclared);
        }

        // Supplier
        let supplier: string | null = null;
        if (pkg.supplier && pkg.supplier !== "NOASSERTION") {
          // SPDX format: "Organization: Name" or "Person: Name"
          supplier = String(pkg.supplier).replace(/^(Organization|Person):\s*/i, "");
        }

        return {
          name: String(pkg.name ?? ""),
          version: pkg.versionInfo ? String(pkg.versionInfo) : null,
          purl,
          license,
          supplier,
        };
      });

    return { format: "spdx", components };
  } catch {
    return null;
  }
}
