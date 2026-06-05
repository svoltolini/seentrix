import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import {
  cvssToSeverity,
  extractCvssScore,
  extractVulnId,
  enrichVulns,
  fetchKevCveIds,
  OSV_VULN_URL,
  CISA_KEV_URL,
  type OsvVuln,
} from "@/lib/sbom/osv";

// MSW lifecycle for this suite. Unhandled requests error out so a missing
// mock can never leak to the real network.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// Pure: cvssToSeverity
// ---------------------------------------------------------------------------

describe("cvssToSeverity", () => {
  it.each([
    [null, "medium"],
    [0, "low"],
    [3.9, "low"],
    [4.0, "medium"],
    [6.9, "medium"],
    [7.0, "high"],
    [8.9, "high"],
    [9.0, "critical"],
    [10, "critical"],
  ] as const)("maps score %s to %s", (score, expected) => {
    expect(cvssToSeverity(score)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Pure: extractCvssScore
// ---------------------------------------------------------------------------

describe("extractCvssScore", () => {
  it("reads a numeric database_specific.cvss.score first", () => {
    const vuln: OsvVuln = {
      id: "OSV-1",
      database_specific: { cvss: { score: 8.2 } },
    };
    expect(extractCvssScore(vuln)).toBe(8.2);
  });

  it("derives a score from a CVSS_V3 vector (high CIA → 9.0)", () => {
    const vuln: OsvVuln = {
      id: "OSV-2",
      severity: [
        { type: "CVSS_V3", score: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H" },
      ],
    };
    expect(extractCvssScore(vuln)).toBe(9.0);
  });

  it("derives a mid score from a partial CVSS_V3 vector", () => {
    const vuln: OsvVuln = {
      id: "OSV-3",
      severity: [
        { type: "CVSS_V3", score: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N" },
      ],
    };
    // C:L + I:L + A:N = 1 + 1 + 0 = 2 → 5.0
    expect(extractCvssScore(vuln)).toBe(5.0);
  });

  it.each([
    ["CRITICAL", 9.5],
    ["HIGH", 7.5],
    ["MODERATE", 5.0],
    ["MEDIUM", 5.0],
    ["LOW", 2.5],
  ] as const)(
    "maps database_specific.severity '%s' to %s",
    (severity, expected) => {
      const vuln: OsvVuln = { id: "OSV-4", database_specific: { severity } };
      expect(extractCvssScore(vuln)).toBe(expected);
    }
  );

  it("returns null when no severity information is present", () => {
    expect(extractCvssScore({ id: "OSV-5" })).toBeNull();
  });

  it("prefers the numeric cvss score over a severity string", () => {
    const vuln: OsvVuln = {
      id: "OSV-6",
      database_specific: { cvss: { score: 6.1 }, severity: "CRITICAL" },
    };
    expect(extractCvssScore(vuln)).toBe(6.1);
  });
});

// ---------------------------------------------------------------------------
// Pure: extractVulnId
// ---------------------------------------------------------------------------

describe("extractVulnId", () => {
  it("prefers a CVE alias over the OSV id", () => {
    expect(
      extractVulnId({ id: "GHSA-xxxx", aliases: ["GHSA-xxxx", "CVE-2024-1234"] })
    ).toBe("CVE-2024-1234");
  });

  it("falls back to the OSV id when there is no CVE alias", () => {
    expect(extractVulnId({ id: "GHSA-yyyy", aliases: ["GHSA-yyyy"] })).toBe(
      "GHSA-yyyy"
    );
  });

  it("falls back to the OSV id when aliases are absent", () => {
    expect(extractVulnId({ id: "OSV-123" })).toBe("OSV-123");
  });
});

// ---------------------------------------------------------------------------
// Integration (MSW): enrichVulns → GET /v1/vulns/{id}
// ---------------------------------------------------------------------------

describe("enrichVulns (OSV detail fetch via MSW)", () => {
  it("enriches each unique id with full detail from /v1/vulns/{id}", async () => {
    server.use(
      http.get(`${OSV_VULN_URL}/:id`, ({ params }) => {
        const id = params.id as string;
        return HttpResponse.json({
          id,
          aliases: [`CVE-for-${id}`],
          summary: `summary for ${id}`,
          database_specific: { severity: "HIGH" },
        });
      })
    );

    const result = await enrichVulns([{ id: "GHSA-a" }, { id: "GHSA-b" }]);

    expect(result.size).toBe(2);
    expect(result.get("GHSA-a")?.summary).toBe("summary for GHSA-a");
    expect(result.get("GHSA-b")?.database_specific?.severity).toBe("HIGH");
  });

  it("deduplicates ids so each detail endpoint is queried once", async () => {
    let calls = 0;
    server.use(
      http.get(`${OSV_VULN_URL}/:id`, ({ params }) => {
        calls += 1;
        return HttpResponse.json({ id: params.id as string });
      })
    );

    await enrichVulns([{ id: "GHSA-dup" }, { id: "GHSA-dup" }, { id: "GHSA-x" }]);
    expect(calls).toBe(2); // GHSA-dup fetched once, GHSA-x once
  });

  it("falls back to the sparse stub when a detail fetch 404s", async () => {
    server.use(
      http.get(`${OSV_VULN_URL}/:id`, ({ params }) => {
        const id = params.id as string;
        if (id === "GHSA-missing") {
          return new HttpResponse(null, { status: 404 });
        }
        return HttpResponse.json({ id, summary: "ok" });
      })
    );

    const stubs: OsvVuln[] = [
      { id: "GHSA-missing", summary: "stub summary" },
      { id: "GHSA-ok" },
    ];
    const result = await enrichVulns(stubs);

    // The failed id is still present, falling back to the original stub.
    expect(result.get("GHSA-missing")?.summary).toBe("stub summary");
    expect(result.get("GHSA-ok")?.summary).toBe("ok");
  });

  it("falls back to the stub when a detail fetch throws (network error)", async () => {
    server.use(
      http.get(`${OSV_VULN_URL}/:id`, () => HttpResponse.error())
    );

    const result = await enrichVulns([{ id: "GHSA-neterr", summary: "stub" }]);
    expect(result.get("GHSA-neterr")?.summary).toBe("stub");
  });

  it("handles more ids than the parallel batch size (>10)", async () => {
    server.use(
      http.get(`${OSV_VULN_URL}/:id`, ({ params }) =>
        HttpResponse.json({ id: params.id as string, summary: "x" })
      )
    );
    const stubs = Array.from({ length: 23 }, (_, i) => ({ id: `GHSA-${i}` }));
    const result = await enrichVulns(stubs);
    expect(result.size).toBe(23);
  });

  it("returns an empty map for no input", async () => {
    const result = await enrichVulns([]);
    expect(result.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Integration (MSW): fetchKevCveIds → CISA KEV catalog
// ---------------------------------------------------------------------------

describe("fetchKevCveIds (CISA KEV via MSW)", () => {
  it("returns the set of known-exploited CVE ids", async () => {
    server.use(
      http.get(CISA_KEV_URL, () =>
        HttpResponse.json({
          vulnerabilities: [
            { cveID: "CVE-2021-44228" },
            { cveID: "CVE-2023-1234" },
          ],
        })
      )
    );

    const kev = await fetchKevCveIds();
    expect(kev.has("CVE-2021-44228")).toBe(true);
    expect(kev.has("CVE-2023-1234")).toBe(true);
    expect(kev.has("CVE-9999-0000")).toBe(false);
    expect(kev.size).toBe(2);
  });

  it("returns an empty set on a non-200 response (best-effort)", async () => {
    server.use(
      http.get(CISA_KEV_URL, () => new HttpResponse(null, { status: 503 }))
    );
    const kev = await fetchKevCveIds();
    expect(kev.size).toBe(0);
  });

  it("returns an empty set on a network error", async () => {
    server.use(http.get(CISA_KEV_URL, () => HttpResponse.error()));
    const kev = await fetchKevCveIds();
    expect(kev.size).toBe(0);
  });
});
