import { z } from "zod";

export const createRestaurantTableSchema = z.object({
  tableNumber: z.string().trim().min(1).max(32),
  seatCount: z.coerce.number().int().min(1).max(100),
  locationLabel: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export type CreateRestaurantTableInput = z.infer<typeof createRestaurantTableSchema>;

export const updateRestaurantTableSchema = z.object({
  tableNumber: z.string().trim().min(1).max(32).optional(),
  seatCount: z.coerce.number().int().min(1).max(100).optional(),
  locationLabel: z.string().max(120).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateRestaurantTableInput = z.infer<typeof updateRestaurantTableSchema>;

export const createTableReservationSchema = z.object({
  tableId: z.string().min(1),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  partySize: z.coerce.number().int().min(1).max(100),
});

export type CreateTableReservationInput = z.infer<typeof createTableReservationSchema>;
