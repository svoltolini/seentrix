import { describe, it, expect } from "vitest";
import { buildCsaf } from "./csaf";
import { buildCycloneDxVex } from "./cyclonedx-vex";
import { buildAdvisory, advisoryFilenameStem } from "./index";
import type { AdvisoryInput } from "./types";

// Minimal typed views of the (plain-JSON) builder output, so the assertions
// stay readable without `any`. Only the paths the tests touch are declared.
interface CsafView {
  document: {
    category: string;
    csaf_version: string;
    publisher: { category: string; namespace: string };
    tracking: { id: string };
  };
  product_tree: {
    full_product_names: unknown[];
    relationships: { category: string }[];
  };
  vulnerabilities: Array<{
    cve: string;
    product_status: Record<string, string[]>;
    flags?: { label: string }[];
    remediations?: { category: string; details: string }[];
  }>;
}
interface VexView {
  bomFormat: string;
  specVersion: string;
  serialNumber: string;
  metadata: {
    supplier: { name: string };
    component: Record<string, unknown>;
  };
  components: { name: string }[];
  vulnerabilities: Array<{
    id: string;
    ratings: { score?: number }[];
    affects: { ref: string }[];
    analysis: { state: string; response?: string[]; justification?: string };
  }>;
}

const input: AdvisoryInput = {
  publisher: {
    name: "Acme GmbH",
    namespace: "https://acme.example",
    contactDetails: "security@acme.example",
  },
  product: {
    id: "prod-123",
    name: "Acme Gateway",
    version: "2.1.0",
    cpe: "cpe:2.3:a:acme:gateway:2.1.0:*:*:*:*:*:*:*",
    purl: "pkg:generic/acme/gateway@2.1.0",
  },
  trackingId: "SEENTRIX-ACME-20260613",
  generatedAt: "2026-06-13T10:00:00.000Z",
  serialNumber: "urn:uuid:11111111-1111-1111-1111-111111111111",
  vulnerabilities: [
    {
      cveId: "CVE-2025-0001",
      description: "Heap overflow in parser.",
      severity: "critical",
      cvssScore: 9.8,
      status: "resolved",
      resolutionType: "fix",
      resolutionNotes: "Upgraded the bundled library.",
      resolvedAt: "2026-06-10T00:00:00.000Z",
      componentName: "libparse",
      componentVersion: "1.2.3",
      purl: "pkg:npm/libparse@1.2.3",
      fixedVersions: ["1.2.4"],
    },
    {
      cveId: "CVE-2025-0002",
      description: "Info leak.",
      severity: "medium",
      cvssScore: 5.3,
      status: "resolved",
      resolutionType: "false_positive",
      resolutionNotes: "The vulnerable function is never called.",
      componentName: "libparse",
      componentVersion: "1.2.3",
      purl: "pkg:npm/libparse@1.2.3",
    },
    {
      cveId: "CVE-2025-0003",
      description: "DoS via crafted input.",
      severity: "high",
      cvssScore: 7.5,
      status: "open",
      componentName: "neturl",
      componentVersion: "0.9.0",
      purl: "pkg:npm/neturl@0.9.0",
    },
  ],
};

describe("buildCsaf", () => {
  const doc = buildCsaf(input) as unknown as CsafView;
  const byCve = Object.fromEntries(doc.vulnerabilities.map((v) => [v.cve, v]));

  it("emits a csaf_vex 2.0 document with vendor publisher", () => {
    expect(doc.document.category).toBe("csaf_vex");
    expect(doc.document.csaf_version).toBe("2.0");
    expect(doc.document.publisher.category).toBe("vendor");
    expect(doc.document.publisher.namespace).toBe("https://acme.example");
    expect(doc.document.tracking.id).toBe("SEENTRIX-ACME-20260613");
  });

  it("de-duplicates components in the product tree and adds relationships", () => {
    // Two CVEs share libparse → one component fpn for it, one for neturl,
    // plus the product itself = 3 full_product_names.
    expect(doc.product_tree.full_product_names).toHaveLength(3);
    expect(doc.product_tree.relationships).toHaveLength(2);
    expect(doc.product_tree.relationships[0].category).toBe(
      "default_component_of",
    );
  });

  it("maps statuses into product_status keys", () => {
    expect(Object.keys(byCve["CVE-2025-0001"].product_status)).toEqual([
      "fixed",
    ]);
    expect(Object.keys(byCve["CVE-2025-0002"].product_status)).toEqual([
      "known_not_affected",
    ]);
    expect(Object.keys(byCve["CVE-2025-0003"].product_status)).toEqual([
      "under_investigation",
    ]);
  });

  it("attaches a flag for known_not_affected and a remediation for fixed", () => {
    expect(byCve["CVE-2025-0002"].flags?.[0].label).toBe(
      "vulnerable_code_not_present",
    );
    expect(byCve["CVE-2025-0001"].remediations?.[0].category).toBe(
      "vendor_fix",
    );
    expect(byCve["CVE-2025-0001"].remediations?.[0].details).toContain("1.2.4");
    // Under-investigation item gets no remediation.
    expect(byCve["CVE-2025-0003"].remediations).toBeUndefined();
  });

  it("product_status references the relationship product id, not the bare component", () => {
    expect(byCve["CVE-2025-0001"].product_status.fixed[0]).toMatch(
      /^PROD-0:CSAFPID-/,
    );
  });
});

describe("buildCycloneDxVex", () => {
  const bom = buildCycloneDxVex(input) as unknown as VexView;
  const byId = Object.fromEntries(bom.vulnerabilities.map((v) => [v.id, v]));

  it("emits a CycloneDX 1.6 BOM with serial number + supplier", () => {
    expect(bom.bomFormat).toBe("CycloneDX");
    expect(bom.specVersion).toBe("1.6");
    expect(bom.serialNumber).toBe(
      "urn:uuid:11111111-1111-1111-1111-111111111111",
    );
    expect(bom.metadata.supplier.name).toBe("Acme GmbH");
    expect(bom.metadata.component["bom-ref"]).toBe("PROD-0");
  });

  it("lists distinct affected components", () => {
    expect(bom.components).toHaveLength(2);
    expect(bom.components.map((c) => c.name).sort()).toEqual([
      "libparse",
      "neturl",
    ]);
  });

  it("maps analysis.state and carries ratings", () => {
    expect(byId["CVE-2025-0001"].analysis.state).toBe("resolved");
    expect(byId["CVE-2025-0001"].analysis.response).toEqual(["update"]);
    expect(byId["CVE-2025-0002"].analysis.state).toBe("not_affected");
    expect(byId["CVE-2025-0002"].analysis.justification).toBe(
      "code_not_present",
    );
    expect(byId["CVE-2025-0003"].analysis.state).toBe("in_triage");
    expect(byId["CVE-2025-0001"].ratings[0].score).toBe(9.8);
    expect(byId["CVE-2025-0001"].affects[0].ref).toBe(
      "pkg:npm/libparse@1.2.3",
    );
  });
});

describe("buildAdvisory + filename", () => {
  it("dispatches by format", () => {
    expect(
      (buildAdvisory("csaf", input) as unknown as CsafView).document.category,
    ).toBe("csaf_vex");
    expect(
      (buildAdvisory("cyclonedx-vex", input) as unknown as VexView).bomFormat,
    ).toBe("CycloneDX");
  });

  it("builds a safe filename stem", () => {
    expect(advisoryFilenameStem("csaf", "Acme Gateway", "2026-06-13T10:00:00Z")).toBe(
      "csaf-advisory-acme-gateway-2026-06-13",
    );
    expect(
      advisoryFilenameStem("cyclonedx-vex", "Acme Gateway", "2026-06-13T10:00:00Z"),
    ).toBe("cyclonedx-vex-acme-gateway-2026-06-13");
  });
});
