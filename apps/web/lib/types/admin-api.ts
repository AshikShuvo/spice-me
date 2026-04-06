/** Shapes returned by the NestJS API (JSON-serialized). */

export type UserRole = "ADMIN" | "USER" | "RESTAURANT_ADMIN";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  resetPasswordExpires?: string | null;
}

export interface RestaurantProfile {
  id: string;
  name: string;
  code: string;
  address: string;
  latitude: number;
  longitude: number;
  timezone: string;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface RestaurantAdminAssignmentRow {
  id: string;
  assignedAt: string;
  user: UserProfile;
}

export interface AssignAdminResponse {
  id: string;
  restaurantId: string;
  userId: string;
}

// ─── Product management types ────────────────────────────────────────────────

export interface SubCategoryProfile {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CategoryProfile {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  _count: { subCategories: number; products: number };
  subCategories?: SubCategoryProfile[];
}

export interface AllergyItemProfile {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
}

export interface ProductVariantProfile {
  id: string;
  name: string;
  sortOrder: number;
  basePrice: string;
  salePrice: string | null;
  isActive: boolean;
}

export interface ProductProfile {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  categoryId: string;
  subCategoryId: string | null;
  isPublished: boolean;
  isActive: boolean;
  category: { id: string; name: string };
  subCategory: { id: string; name: string } | null;
  pricing: {
    hasVariants: boolean;
    basePrice: string | null;
    salePrice: string | null;
    variants: ProductVariantProfile[];
  };
  allergyItems: Array<{ id: string; name: string; iconUrl: string | null }>;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantProductManageRow {
  id: string;
  restaurantId: string;
  productId: string;
  isAvailable: boolean;
  addedAt: string;
  updatedAt: string;
  product: ProductProfile;
}
