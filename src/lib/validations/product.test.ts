import { describe, it, expect } from "vitest";
import { createProductSchema, updateProductSchema } from "@/lib/validations/product";
import {
  assessmentSchema,
  productInfoSchema,
  INITIAL_WIZARD_DATA,
} from "@/lib/validations/assessment";

describe("createProductSchema", () => {
  it("accepts a valid product", () => {
    expect(
      createProductSchema.safeParse({
        name: "Smart Lock",
        type: "iot",
        description: "A connected door lock",
      }).success
    ).toBe(true);
  });

  it("allows an omitted description", () => {
    expect(
      createProductSchema.safeParse({ name: "CLI tool", type: "software" }).success
    ).toBe(true);
  });

  it.each(["hardware", "software", "firmware", "iot"])(
    "accepts product type '%s'",
    (type) => {
      expect(createProductSchema.safeParse({ name: "X", type }).success).toBe(true);
    }
  );

  it("rejects an unknown product type", () => {
    expect(
      createProductSchema.safeParse({ name: "X", type: "saas" }).success
    ).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(
      createProductSchema.safeParse({ name: "", type: "software" }).success
    ).toBe(false);
  });
});

describe("updateProductSchema", () => {
  it("shares the create contract (name + type required)", () => {
    expect(
      updateProductSchema.safeParse({ name: "Renamed", type: "hardware" }).success
    ).toBe(true);
    expect(updateProductSchema.safeParse({ type: "hardware" }).success).toBe(false);
  });
});

describe("productInfoSchema", () => {
  it("validates the same shape as the create schema", () => {
    expect(
      productInfoSchema.safeParse({ name: "Gadget", type: "firmware" }).success
    ).toBe(true);
  });
});

describe("assessmentSchema", () => {
  const valid = {
    name: "Smart Camera",
    type: "iot" as const,
    description: "",
    hasDigitalElements: true,
    isEuDistribution: true,
    excludedSectors: [] as string[],
    subcategoryId: "smart_home_cameras",
  };

  it("accepts a complete assessment payload", () => {
    expect(assessmentSchema.safeParse(valid).success).toBe(true);
  });

  it("allows a null subcategoryId (default-class path)", () => {
    expect(assessmentSchema.safeParse({ ...valid, subcategoryId: null }).success).toBe(
      true
    );
  });

  it("requires the boolean scope flags", () => {
    const { hasDigitalElements: _drop, ...without } = valid;
    expect(assessmentSchema.safeParse(without).success).toBe(false);
  });

  it("requires excludedSectors to be an array", () => {
    expect(
      assessmentSchema.safeParse({ ...valid, excludedSectors: "medical" }).success
    ).toBe(false);
  });
});

describe("INITIAL_WIZARD_DATA", () => {
  it("starts every scope decision unset (null) so nothing is assumed", () => {
    expect(INITIAL_WIZARD_DATA.type).toBeNull();
    expect(INITIAL_WIZARD_DATA.hasDigitalElements).toBeNull();
    expect(INITIAL_WIZARD_DATA.isEuDistribution).toBeNull();
    expect(INITIAL_WIZARD_DATA.subcategoryId).toBeNull();
    expect(INITIAL_WIZARD_DATA.excludedSectors).toEqual([]);
  });
});
