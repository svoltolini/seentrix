import { describe, it, expect } from "vitest";
import {
  COUNTRIES,
  EU_EEA_COUNTRIES,
  OTHER_COUNTRIES,
  isKnownCountry,
} from "./countries";

describe("countries", () => {
  it("lists EU/EEA countries before the rest of the world", () => {
    expect(COUNTRIES.length).toBe(
      EU_EEA_COUNTRIES.length + OTHER_COUNTRIES.length,
    );
    expect(COUNTRIES[0]).toEqual(EU_EEA_COUNTRIES[0]);
    expect(COUNTRIES[EU_EEA_COUNTRIES.length]).toEqual(OTHER_COUNTRIES[0]);
  });

  it("has unique ISO codes and country names", () => {
    const codes = COUNTRIES.map((c) => c.code);
    const names = COUNTRIES.map((c) => c.name);
    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it("includes the founder's home country (Switzerland) and key markets", () => {
    const names = new Set(COUNTRIES.map((c) => c.name));
    expect(names.has("Switzerland")).toBe(true);
    expect(names.has("Germany")).toBe(true);
    expect(names.has("United States")).toBe(true);
  });

  it("recognises known countries and rejects unknown free text", () => {
    expect(isKnownCountry("Germany")).toBe(true);
    expect(isKnownCountry("  France  ")).toBe(true);
    expect(isKnownCountry("Narnia")).toBe(false);
    expect(isKnownCountry("")).toBe(false);
  });
});
