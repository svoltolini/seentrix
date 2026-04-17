import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["hardware", "software", "firmware", "iot"]),
  description: z.string().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["hardware", "software", "firmware", "iot"]),
  description: z.string().optional(),
});

export type CreateProductValues = z.infer<typeof createProductSchema>;
export type UpdateProductValues = z.infer<typeof updateProductSchema>;
