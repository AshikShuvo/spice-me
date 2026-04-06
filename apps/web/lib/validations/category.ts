import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().optional(),
  imageUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateCategorySchema = createCategorySchema
  .partial()
  .extend({ isActive: z.boolean().optional() });

export const createSubcategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateSubcategorySchema = createSubcategorySchema
  .partial()
  .extend({ isActive: z.boolean().optional() });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateSubcategoryInput = z.infer<typeof createSubcategorySchema>;
export type UpdateSubcategoryInput = z.infer<typeof updateSubcategorySchema>;
