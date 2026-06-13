import { describe, it, expect } from "vitest";
import {
  LOCALES,
  DEFAULT_LOCALE,
  isLocale,
  localeFromAcceptLanguage,
} from "./locales";

describe("locales", () => {
  it("supports the eight market languages with en as default", () => {
    expect([...LOCALES]).toEqual([
      "en",
      "de",
      "fr",
      "it",
      "pl",
      "es",
      "pt",
      "sv",
    ]);
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("isLocale guards correctly", () => {
    expect(isLocale("de")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("es")).toBe(true);
    expect(isLocale("sv")).toBe(true);
    expect(isLocale("zh")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(42)).toBe(false);
  });

  describe("localeFromAcceptLanguage", () => {
    it("falls back to default when empty/unknown", () => {
      expect(localeFromAcceptLanguage(null)).toBe("en");
      expect(localeFromAcceptLanguage("")).toBe("en");
      // zh/ja are not supported → fall back to en.
      expect(localeFromAcceptLanguage("zh-CN,zh;q=0.9,ja;q=0.8")).toBe("en");
    });

    it("picks the highest-quality supported locale", () => {
      expect(localeFromAcceptLanguage("de-DE,de;q=0.9,en;q=0.8")).toBe("de");
      expect(localeFromAcceptLanguage("fr-CH,fr;q=0.9")).toBe("fr");
      expect(localeFromAcceptLanguage("it")).toBe("it");
      expect(localeFromAcceptLanguage("pl-PL,pl;q=0.9")).toBe("pl");
      expect(localeFromAcceptLanguage("sv-SE,sv;q=0.9")).toBe("sv");
    });

    it("respects q-ordering even when unsupported locales come first", () => {
      // zh has higher q but is unsupported → first supported (de) wins.
      expect(
        localeFromAcceptLanguage("zh;q=1.0,de;q=0.7,en;q=0.3"),
      ).toBe("de");
    });

    it("maps regional subtags to their base language", () => {
      expect(localeFromAcceptLanguage("de-CH")).toBe("de");
    });
  });
});
