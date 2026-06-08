import { describe, it, expect } from "vitest";
import {
  LOCALES,
  DEFAULT_LOCALE,
  isLocale,
  localeFromAcceptLanguage,
} from "./locales";

describe("locales", () => {
  it("supports exactly en/de/fr/it with en as default", () => {
    expect([...LOCALES]).toEqual(["en", "de", "fr", "it"]);
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("isLocale guards correctly", () => {
    expect(isLocale("de")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("es")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(42)).toBe(false);
  });

  describe("localeFromAcceptLanguage", () => {
    it("falls back to default when empty/unknown", () => {
      expect(localeFromAcceptLanguage(null)).toBe("en");
      expect(localeFromAcceptLanguage("")).toBe("en");
      expect(localeFromAcceptLanguage("es-ES,es;q=0.9")).toBe("en");
    });

    it("picks the highest-quality supported locale", () => {
      expect(localeFromAcceptLanguage("de-DE,de;q=0.9,en;q=0.8")).toBe("de");
      expect(localeFromAcceptLanguage("fr-CH,fr;q=0.9")).toBe("fr");
      expect(localeFromAcceptLanguage("it")).toBe("it");
    });

    it("respects q-ordering even when unsupported locales come first", () => {
      // es has higher q but is unsupported → first supported (de) wins.
      expect(
        localeFromAcceptLanguage("es;q=1.0,de;q=0.7,en;q=0.3"),
      ).toBe("de");
    });

    it("maps regional subtags to their base language", () => {
      expect(localeFromAcceptLanguage("de-CH")).toBe("de");
    });
  });
});
