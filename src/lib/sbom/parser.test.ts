import { describe, it, expect } from "vitest";
import { detectFormat, parseSbom } from "@/lib/sbom/parser";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const cycloneDxJson = JSON.stringify({
  bomFormat: "CycloneDX",
  specVersion: "1.5",
  components: [
    {
      type: "library",
      name: "lodash",
      version: "4.17.21",
      purl: "pkg:npm/lodash@4.17.21",
      licenses: [{ license: { id: "MIT" } }],
      supplier: { name: "Lodash Team" },
    },
    {
      type: "library",
      name: "react",
      version: "19.0.0",
      purl: "pkg:npm/react@19.0.0",
      licenses: [{ expression: "MIT OR Apache-2.0" }],
      publisher: "Meta",
    },
    {
      // Minimal component: no version, license, supplier, or purl.
      type: "library",
      name: "bare-pkg",
    },
  ],
});

const cycloneDxXml = `<?xml version="1.0" encoding="UTF-8"?>
<bom xmlns="http://cyclonedx.org/schema/bom/1.5">
  <components>
    <component type="library">
      <name>express</name>
      <version>4.18.2</version>
      <purl>pkg:npm/express@4.18.2</purl>
      <licenses>
        <license><id>MIT</id></license>
      </licenses>
      <supplier><name>OpenJS Foundation</name></supplier>
    </component>
    <component type="library">
      <name>solo-component</name>
      <version>1.0.0</version>
    </component>
  </components>
</bom>`;

const spdxJson = JSON.stringify({
  spdxVersion: "SPDX-2.3",
  name: "example-sbom",
  packages: [
    {
      SPDXID: "SPDXRef-DOCUMENT",
      name: "root-document",
    },
    {
      SPDXID: "SPDXRef-Package-axios",
      name: "axios",
      versionInfo: "1.6.0",
      licenseConcluded: "MIT",
      supplier: "Organization: Axios",
      externalRefs: [
        {
          referenceType: "purl",
          referenceLocator: "pkg:npm/axios@1.6.0",
        },
      ],
    },
    {
      SPDXID: "SPDXRef-Package-noassert",
      name: "noassert-pkg",
      versionInfo: "2.0.0",
      licenseConcluded: "NOASSERTION",
      licenseDeclared: "Apache-2.0",
      supplier: "NOASSERTION",
    },
  ],
});

// ---------------------------------------------------------------------------
// detectFormat
// ---------------------------------------------------------------------------

describe("detectFormat", () => {
  it("detects CycloneDX JSON via bomFormat", () => {
    expect(detectFormat(cycloneDxJson)).toBe("cyclonedx");
  });

  it("detects SPDX JSON via spdxVersion", () => {
    expect(detectFormat(spdxJson)).toBe("spdx");
  });

  it("detects CycloneDX XML", () => {
    expect(detectFormat(cycloneDxXml)).toBe("cyclonedx");
  });

  it("returns null for invalid JSON", () => {
    expect(detectFormat("{ not valid json")).toBeNull();
  });

  it("returns null for unrelated JSON", () => {
    expect(detectFormat(JSON.stringify({ hello: "world" }))).toBeNull();
  });

  it("returns null for plain text / unknown XML", () => {
    expect(detectFormat("just some text")).toBeNull();
    expect(detectFormat("<note>hello</note>")).toBeNull();
  });

  it("tolerates leading/trailing whitespace", () => {
    expect(detectFormat(`\n   ${cycloneDxJson}  \n`)).toBe("cyclonedx");
  });
});

// ---------------------------------------------------------------------------
// parseSbom — CycloneDX JSON
// ---------------------------------------------------------------------------

describe("parseSbom — CycloneDX JSON", () => {
  it("parses all components with the cyclonedx format tag", () => {
    const result = parseSbom(cycloneDxJson);
    expect(result?.format).toBe("cyclonedx");
    expect(result?.components).toHaveLength(3);
  });

  it("extracts name, version, purl, license id, and supplier", () => {
    const lodash = parseSbom(cycloneDxJson)!.components[0];
    expect(lodash).toEqual({
      name: "lodash",
      version: "4.17.21",
      purl: "pkg:npm/lodash@4.17.21",
      license: "MIT",
      supplier: "Lodash Team",
    });
  });

  it("reads an SPDX license expression and falls back to publisher for supplier", () => {
    const react = parseSbom(cycloneDxJson)!.components[1];
    expect(react.license).toBe("MIT OR Apache-2.0");
    expect(react.supplier).toBe("Meta");
  });

  it("nulls out missing optional fields on a bare component", () => {
    const bare = parseSbom(cycloneDxJson)!.components[2];
    expect(bare).toEqual({
      name: "bare-pkg",
      version: null,
      purl: null,
      license: null,
      supplier: null,
    });
  });

  it("returns an empty component list when 'components' is absent", () => {
    const result = parseSbom(JSON.stringify({ bomFormat: "CycloneDX" }));
    expect(result).toEqual({ format: "cyclonedx", components: [] });
  });
});

// ---------------------------------------------------------------------------
// parseSbom — CycloneDX XML
// ---------------------------------------------------------------------------

describe("parseSbom — CycloneDX XML", () => {
  it("parses XML components with license and supplier", () => {
    const result = parseSbom(cycloneDxXml);
    expect(result?.format).toBe("cyclonedx");
    expect(result?.components).toHaveLength(2);

    const express = result!.components[0];
    expect(express).toEqual({
      name: "express",
      version: "4.18.2",
      purl: "pkg:npm/express@4.18.2",
      license: "MIT",
      supplier: "OpenJS Foundation",
    });
  });

  it("handles a component with no license or supplier", () => {
    const solo = parseSbom(cycloneDxXml)!.components[1];
    expect(solo).toEqual({
      name: "solo-component",
      version: "1.0.0",
      purl: null,
      license: null,
      supplier: null,
    });
  });
});

// ---------------------------------------------------------------------------
// parseSbom — SPDX JSON
// ---------------------------------------------------------------------------

describe("parseSbom — SPDX JSON", () => {
  it("parses packages and tags the spdx format", () => {
    const result = parseSbom(spdxJson);
    expect(result?.format).toBe("spdx");
    // The SPDXRef-DOCUMENT root package is filtered out.
    expect(result?.components).toHaveLength(2);
  });

  it("excludes the SPDXRef-DOCUMENT root package", () => {
    const names = parseSbom(spdxJson)!.components.map((c) => c.name);
    expect(names).not.toContain("root-document");
    expect(names).toEqual(["axios", "noassert-pkg"]);
  });

  it("extracts version, concluded license, purl, and a cleaned supplier", () => {
    const axios = parseSbom(spdxJson)!.components[0];
    expect(axios).toEqual({
      name: "axios",
      version: "1.6.0",
      purl: "pkg:npm/axios@1.6.0",
      license: "MIT",
      supplier: "Axios", // "Organization: Axios" prefix stripped
    });
  });

  it("falls back to licenseDeclared when concluded is NOASSERTION, and nulls NOASSERTION supplier", () => {
    const pkg = parseSbom(spdxJson)!.components[1];
    expect(pkg.license).toBe("Apache-2.0");
    expect(pkg.supplier).toBeNull();
  });

  it("returns an empty list when 'packages' is absent", () => {
    const result = parseSbom(JSON.stringify({ spdxVersion: "SPDX-2.3" }));
    expect(result).toEqual({ format: "spdx", components: [] });
  });
});

// ---------------------------------------------------------------------------
// parseSbom — invalid input
// ---------------------------------------------------------------------------

describe("parseSbom — invalid input", () => {
  it("returns null for unrecognized content", () => {
    expect(parseSbom("not an sbom")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(parseSbom("{ bomFormat: ")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(parseSbom("")).toBeNull();
  });
});
