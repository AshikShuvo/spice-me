/** Shared Prisma `include` for product rows mapped with `ProductsService.toProfile()`. */
export const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true } },
  subCategory: { select: { id: true, name: true } },
  variants: { orderBy: { sortOrder: 'asc' as const } },
  allergyItems: { include: { allergyItem: true } },
} as const;
