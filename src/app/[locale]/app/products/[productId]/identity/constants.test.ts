import { describe, it, expect } from "vitest";
import { CE_LOCATIONS, isCeLocation, simplifiedDocPath } from "./constants";

describe("CE locations", () => {
  it("covers product / packaging / documentation / website", () => {
    expect([...CE_LOCATIONS]).toEqual([
      "product",
      "packaging",
      "documentation",
      "website",
    ]);
  });
  it("validates membership", () => {
    expect(isCeLocation("product")).toBe(true);
    expect(isCeLocation("billboard")).toBe(false);
    expect(isCeLocation(42)).toBe(false);
  });
});

describe("simplifiedDocPath", () => {
  it("builds the public DoC path", () => {
    expect(simplifiedDocPath("acme", "abc-123")).toBe("/doc/acme/abc-123");
  });
});
