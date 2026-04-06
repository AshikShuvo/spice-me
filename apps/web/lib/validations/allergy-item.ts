import { z } from "zod";

export const createAllergyItemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().optional(),
  iconUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});

export const updateAllergyItemSchema = createAllergyItemSchema.partial();

export type CreateAllergyItemInput = z.infer<typeof createAllergyItemSchema>;
export type UpdateAllergyItemInput = z.infer<typeof updateAllergyItemSchema>;
