import { z } from "zod";

/** Optional Prisma cuid — empty Select value becomes `undefined` (omit from payload). */
const optionalSubCategoryId = z
  .string()
  .optional()
  .transform((s) => (s === undefined || s === "" ? undefined : s))
  .pipe(z.string().min(1).optional());

function offerPriceCheck(data: {
  regularPrice?: number | null;
  offerPrice?: number | null;
}) {
  const regular = data.regularPrice;
  const offer = data.offerPrice;
  if (offer != null && regular != null && offer >= regular) return false;
  return true;
}

const OFFER_PRICE_REFINE = {
  message: "Offer price must be less than regular price",
  path: ["offerPrice"] as [string],
} as const;

const priceField = z
  .number({ message: "Enter a valid number" })
  .min(0, "Must be 0 or greater")
  .multipleOf(0.01, "Maximum 2 decimal places");

export const createProductSchema = z
  .object({
    title: z
      .string()
      .min(2, "Title must be at least 2 characters")
      .max(300),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    imageUrl: z.string().url("Enter a valid image URL"),
    categoryId: z.string().min(1, "Select a category"),
    subCategoryId: optionalSubCategoryId,
    regularPrice: priceField.optional(),
    offerPrice: priceField.optional(),
    isVatExclusive: z.boolean().optional(),
  })
  .refine(offerPriceCheck, OFFER_PRICE_REFINE);

export const updateProductSchema = z
  .object({
    title: z.string().min(2).max(300).optional(),
    description: z.string().min(10).optional(),
    imageUrl: z.string().url("Enter a valid image URL").optional(),
    categoryId: z.string().min(1).optional(),
    subCategoryId: z
      .string()
      .nullish()
      .transform((s) =>
        s === undefined || s === null || s === "" ? undefined : s,
      )
      .pipe(z.string().min(1).optional()),
    regularPrice: priceField.optional().nullable(),
    offerPrice: priceField.optional().nullable(),
    isVatExclusive: z.boolean().optional(),
  })
  .refine(offerPriceCheck, OFFER_PRICE_REFINE);

export const createVariantSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    sortOrder: z.number().int().min(0).optional(),
    regularPrice: priceField,
    offerPrice: priceField.optional(),
  })
  .refine(offerPriceCheck, OFFER_PRICE_REFINE);

export const updateVariantSchema = z
  .object({
    name: z.string().min(1).optional(),
    sortOrder: z.number().int().min(0).optional(),
    regularPrice: priceField.optional(),
    offerPrice: priceField.optional().nullable(),
    isActive: z.boolean().optional(),
    isDefault: z.boolean().optional(),
  })
  .refine(offerPriceCheck, OFFER_PRICE_REFINE);

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
/** React Hook Form values before Zod output transform (e.g. `subCategoryId` may be `null`). */
export type UpdateProductFormValues = z.input<typeof updateProductSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
