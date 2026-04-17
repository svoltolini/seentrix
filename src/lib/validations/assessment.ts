import { z } from "zod";

export const productInfoSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["hardware", "software", "firmware", "iot"]),
  description: z.string().optional(),
});

export const assessmentSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["hardware", "software", "firmware", "iot"]),
  description: z.string().optional(),
  hasDigitalElements: z.boolean(),
  isEuDistribution: z.boolean(),
  excludedSectors: z.array(z.string()),
  subcategoryId: z.string().nullable(),
});

export type ProductInfoValues = z.infer<typeof productInfoSchema>;
export type AssessmentValues = z.infer<typeof assessmentSchema>;

export type WizardData = {
  name: string;
  type: "hardware" | "software" | "firmware" | "iot" | null;
  description: string;
  hasDigitalElements: boolean | null;
  isEuDistribution: boolean | null;
  excludedSectors: string[];
  subcategoryId: string | null;
};

export const INITIAL_WIZARD_DATA: WizardData = {
  name: "",
  type: null,
  description: "",
  hasDigitalElements: null,
  isEuDistribution: null,
  excludedSectors: [],
  subcategoryId: null,
};
