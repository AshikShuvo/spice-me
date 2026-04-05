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
