import { describe, it, expect } from "vitest";
import {
  loginSchema,
  signupSchema,
  onboardingSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

describe("loginSchema", () => {
  it("accepts a valid email + password", () => {
    expect(
      loginSchema.safeParse({ email: "sam@example.com", password: "x" }).success
    ).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(
      loginSchema.safeParse({ email: "sam@example.com", password: "" }).success
    ).toBe(false);
  });
});

describe("signupSchema", () => {
  it("accepts a valid signup", () => {
    expect(
      signupSchema.safeParse({
        email: "sam@example.com",
        fullName: "Sam V",
        password: "supersecret",
      }).success
    ).toBe(true);
  });

  it("requires a password of at least 8 characters", () => {
    const result = signupSchema.safeParse({
      email: "sam@example.com",
      fullName: "Sam V",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("requires a non-empty full name", () => {
    expect(
      signupSchema.safeParse({
        email: "sam@example.com",
        fullName: "",
        password: "supersecret",
      }).success
    ).toBe(false);
  });
});

describe("onboardingSchema", () => {
  const valid = {
    organizationName: "Acme",
    legalName: "Acme GmbH",
    registrationNumber: "CHE-123",
    entityType: "manufacturer" as const,
    addressLine1: "Bahnhofstrasse 1",
    postalCode: "6343",
    city: "Rotkreuz",
    country: "CH",
    signatoryName: "Sam V",
    signatoryPosition: "CEO",
    contactEmail: "sam@example.com",
  };

  it("accepts a complete manufacturer entity", () => {
    expect(onboardingSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    "manufacturer",
    "authorised_representative",
    "importer",
    "distributor",
  ])("accepts entityType '%s'", (entityType) => {
    expect(onboardingSchema.safeParse({ ...valid, entityType }).success).toBe(true);
  });

  it("rejects an unknown entityType", () => {
    expect(
      onboardingSchema.safeParse({ ...valid, entityType: "vendor" }).success
    ).toBe(false);
  });

  it("allows an empty-string website (the explicit literal)", () => {
    expect(onboardingSchema.safeParse({ ...valid, website: "" }).success).toBe(true);
  });

  it("accepts a valid website URL", () => {
    expect(
      onboardingSchema.safeParse({ ...valid, website: "https://acme.example" }).success
    ).toBe(true);
  });

  it("rejects a malformed website URL", () => {
    expect(
      onboardingSchema.safeParse({ ...valid, website: "not-a-url" }).success
    ).toBe(false);
  });

  it("requires the legal fields needed for CRA document generation", () => {
    const { legalName: _legalName, ...withoutLegalName } = valid;
    expect(onboardingSchema.safeParse(withoutLegalName).success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "bad" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts matching passwords of sufficient length", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: "supersecret",
        confirmPassword: "supersecret",
      }).success
    ).toBe(true);
  });

  it("rejects when the passwords do not match", () => {
    const result = resetPasswordSchema.safeParse({
      password: "supersecret",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const mismatch = result.error.issues.find((i) =>
        i.path.includes("confirmPassword")
      );
      expect(mismatch?.message).toBe("passwordMismatch");
    }
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: "short",
        confirmPassword: "short",
      }).success
    ).toBe(false);
  });
});
