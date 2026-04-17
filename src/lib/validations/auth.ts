import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const signupSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  password: z.string().min(8),
});

export const onboardingSchema = z.object({
  // Step 1 — identity
  organizationName: z.string().min(1),
  // Step 2 — legal entity (required for CRA document generation)
  legalName: z.string().min(1),
  registrationNumber: z.string().min(1),
  entityType: z.enum([
    "manufacturer",
    "authorised_representative",
    "importer",
    "distributor",
  ]),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  postalCode: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  // Step 3 — signatory + contact
  signatoryName: z.string().min(1),
  signatoryPosition: z.string().min(1),
  contactEmail: z.string().email(),
  website: z.string().url().optional().or(z.literal("")),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordMismatch",
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
export type OnboardingValues = z.infer<typeof onboardingSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
