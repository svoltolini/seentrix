import { describe, it, expect } from "vitest";
import {
  buildCycloneDxSbom,
  buildSpdxSbom,
  buildSbom,
  sbomFilenameStem,
  type SbomExportInput,
} from "./export";

const input: SbomExportInput = {
  product: { name: "Acme Gateway", version: "2.1.0" },
  supplier: { name: "Acme GmbH", url: "https://acme.example" },
  generatedAt: "2026-06-13T10:00:00.000Z",
  serialNumber: "urn:uuid:22222222-2222-2222-2222-222222222222",
  components: [
    {
      name: "libparse",
      version: "1.2.3",
      purl: "pkg:npm/libparse@1.2.3",
      license: "MIT",
      supplier: "OpenJS",
    },
    {
      name: "fancy ui kit",
      version: "4.0.0",
      license: "Apache 2.0 or commercial",
    },
  ],
};

interface CycloneView {
  bomFormat: string;
  specVersion: string;
  serialNumber: string;
  metadata: { supplier: { name: string }; manufacturer: { name: string } };
  components: Array<{
    name: string;
    purl?: string;
    supplier?: { name: string };
    licenses?: { license: { name: string } }[];
  }>;
}
interface SpdxView {
  spdxVersion: string;
  dataLicense: string;
  packages: Array<{
    name: string;
    SPDXID: string;
    licenseDeclared: string;
    licenseComments?: string;
    externalRefs?: { referenceType: string; referenceLocator: string }[];
  }>;
  relationships: Array<{ relationshipType: string }>;
}

describe("buildCycloneDxSbom", () => {
  const bom = buildCycloneDxSbom(input) as unknown as CycloneView;
  it("emits a 1.6 BOM with supplier + manufacturer", () => {
    expect(bom.bomFormat).toBe("CycloneDX");
    expect(bom.specVersion).toBe("1.6");
    expect(bom.serialNumber).toContain("urn:uuid:");
    expect(bom.metadata.supplier.name).toBe("Acme GmbH");
    expect(bom.metadata.manufacturer.name).toBe("Acme GmbH");
  });
  it("carries components with purl, supplier, free-text license name", () => {
    expect(bom.components).toHaveLength(2);
    const lib = bom.components.find((c) => c.name === "libparse")!;
    expect(lib.purl).toBe("pkg:npm/libparse@1.2.3");
    expect(lib.supplier?.name).toBe("OpenJS");
    expect(lib.licenses?.[0].license.name).toBe("MIT");
  });
});

describe("buildSpdxSbom", () => {
  const doc = buildSpdxSbom(input) as unknown as SpdxView;
  it("emits SPDX-2.3 with a product package + one per component", () => {
    expect(doc.spdxVersion).toBe("SPDX-2.3");
    expect(doc.dataLicense).toBe("CC0-1.0");
    // product + 2 components
    expect(doc.packages).toHaveLength(3);
    expect(doc.relationships.some((r) => r.relationshipType === "DESCRIBES")).toBe(
      true,
    );
    expect(
      doc.relationships.filter((r) => r.relationshipType === "CONTAINS"),
    ).toHaveLength(2);
  });
  it("uses a clean SPDX license id directly but NOASSERTs a messy one", () => {
    const lib = doc.packages.find((p) => p.name === "libparse")!;
    expect(lib.licenseDeclared).toBe("MIT");
    expect(lib.externalRefs?.[0].referenceLocator).toBe(
      "pkg:npm/libparse@1.2.3",
    );
    const ui = doc.packages.find((p) => p.name === "fancy ui kit")!;
    expect(ui.licenseDeclared).toBe("NOASSERTION");
    expect(ui.licenseComments).toContain("Apache 2.0 or commercial");
  });
  it("produces SPDXID values within the allowed charset", () => {
    for (const p of doc.packages) {
      expect(p.SPDXID).toMatch(/^SPDXRef-[0-9a-zA-Z.\-+]+$/);
    }
  });
});

describe("buildSbom + filename", () => {
  it("dispatches by format", () => {
    expect((buildSbom("cyclonedx", input) as { bomFormat: string }).bomFormat).toBe(
      "CycloneDX",
    );
    expect((buildSbom("spdx", input) as { spdxVersion: string }).spdxVersion).toBe(
      "SPDX-2.3",
    );
  });
  it("builds a safe filename stem", () => {
    expect(sbomFilenameStem("cyclonedx", "Acme Gateway", "2026-06-13T00:00:00Z")).toBe(
      "acme-gateway-sbom-2026-06-13",
    );
  });
});
