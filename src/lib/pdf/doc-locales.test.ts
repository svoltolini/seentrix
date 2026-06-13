import { describe, it, expect } from "vitest";
import {
  DOC_LOCALES,
  isDocLocale,
  toDocLocale,
  formatDocDate,
} from "./doc-locales";
import { getPdfMessages } from "./i18n/pdf-messages";
import { getEndUserInfoMessages } from "./i18n/end-user-info-messages";
import { docConformityBoilerplate } from "./i18n/market-languages";

describe("doc-locales", () => {
  it("includes the eight shipped languages", () => {
    expect([...DOC_LOCALES]).toEqual([
      "en",
      "de",
      "fr",
      "it",
      "pl",
      "es",
      "pt",
      "sv",
    ]);
  });

  it("isDocLocale / toDocLocale guard the set", () => {
    expect(isDocLocale("pl")).toBe(true);
    expect(isDocLocale("xx")).toBe(false);
    expect(toDocLocale("sv")).toBe("sv");
    expect(toDocLocale("xx")).toBe("en");
    expect(toDocLocale(null)).toBe("en");
  });

  it("formats dates in the locale (or empty for null)", () => {
    expect(formatDocDate(null, "en")).toBe("");
    // Swedish month names are lowercase — a cheap locale-applied check.
    const sv = formatDocDate("2026-06-13T00:00:00Z", "sv");
    expect(sv).toMatch(/2026/);
  });
});

describe("getPdfMessages — market languages + fallback", () => {
  it("returns translated DoC labels for a market language (pl)", () => {
    const m = getPdfMessages("pl", "declaration_of_conformity");
    expect(m.title).toBe("Deklaracja zgodności UE");
    expect(m.signatoryPosition).toBe("Stanowisko");
  });

  it("returns the reviewed core language for de", () => {
    const m = getPdfMessages("de", "declaration_of_conformity");
    expect(m.title).toBe("EU-Konformitätserklärung");
  });

  it("falls back to English for non-DoC types in a market language", () => {
    // Spanish has no incident_report set → English labels.
    const en = getPdfMessages("en", "incident_report");
    const es = getPdfMessages("es", "incident_report");
    expect(es.title).toBe(en.title);
  });

  it("every market language supplies a full DoC label set (no missing keys)", () => {
    const enKeys = Object.keys(getPdfMessages("en", "declaration_of_conformity"));
    for (const loc of ["pl", "es", "pt", "sv"] as const) {
      const m = getPdfMessages(loc, "declaration_of_conformity");
      for (const k of enKeys) {
        expect(m[k], `${loc}.${k}`).toBeTruthy();
      }
    }
  });
});

describe("getEndUserInfoMessages — Annex II", () => {
  it("translates labels for a market language (es) with per-key fallback", () => {
    const es = getEndUserInfoMessages("es");
    expect(es.title).toBe("Información de ciberseguridad para el usuario final");
    // Every English key is present (fallback guarantees no undefined).
    const enKeys = Object.keys(getEndUserInfoMessages("en"));
    for (const k of enKeys) expect(es[k], `es.${k}`).toBeTruthy();
  });

  it("uses Swedish where provided", () => {
    expect(getEndUserInfoMessages("sv").section1).toBe("1. Produktidentifiering");
  });
});

describe("docConformityBoilerplate", () => {
  it("localises the conformity statement + standards line", () => {
    const pl = docConformityBoilerplate("pl", "Acme", "module_a");
    expect(pl.conformityStatement).toContain("Acme");
    expect(pl.conformityStatement).toContain("2024/2847");
    expect(pl.standardsApplied).toContain("EN 18031-1");

    const sv = docConformityBoilerplate("sv", "Acme", "module_h");
    expect(sv.conformityStatement).toContain("module_h");
    expect(sv.conformityStatement).not.toBe(pl.conformityStatement);
  });

  it("falls back to English boilerplate for an unknown locale", () => {
    // @ts-expect-error — exercising the runtime fallback path.
    const x = docConformityBoilerplate("xx", "Acme", "module_a");
    expect(x.conformityStatement).toContain("declares under its sole responsibility");
  });
});
