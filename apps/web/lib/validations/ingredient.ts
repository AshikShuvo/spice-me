import { z } from "zod";

const priceField = z
  .number({ message: "Enter a valid number" })
  .min(0, "Must be 0 or greater")
  .multipleOf(0.01, "Maximum 2 decimal places");

export const createIngredientSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  isAllergen: z.boolean().optional(),
});

export const updateIngredientSchema = createIngredientSchema.partial();

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;

export const ingredientTemplateItemSchema = z.object({
  ingredientId: z.string().min(1),
  extraPrice: priceField,
  sortOrder: z.number().int().min(0).optional(),
});

export const createIngredientTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  sortOrder: z.number().int().min(0).optional(),
  items: z.array(ingredientTemplateItemSchema).min(1),
});

export const updateIngredientTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  items: z.array(ingredientTemplateItemSchema).min(1).optional(),
});

export type CreateIngredientTemplateInput = z.infer<
  typeof createIngredientTemplateSchema
>;
export type UpdateIngredientTemplateInput = z.infer<
  typeof updateIngredientTemplateSchema
>;
