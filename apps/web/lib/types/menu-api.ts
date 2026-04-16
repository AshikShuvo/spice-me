import type { ProductProfile } from "./admin-api";

export type MenuSubCategoryItem = {
  id: string;
  name: string;
  sortOrder: number;
};

export type MenuCategoryItem = {
  id: string;
  name: string;
  sortOrder: number;
  subCategories: MenuSubCategoryItem[];
};

export type MenuResponse = {
  scope: "global" | "restaurant";
  restaurant: { id: string; name: string; code: string } | null;
  categories: MenuCategoryItem[];
  products: ProductProfile[];
  currencyCode: string;
};
