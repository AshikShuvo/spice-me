import { z } from "zod";

const hhmm = /^\d{2}:\d{2}$/;

const restaurantBase = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().min(1, "Timezone is required"),
  openingTime: z
    .string()
    .regex(hhmm, "Use HH:MM format (UTC)"),
  closingTime: z
    .string()
    .regex(hhmm, "Use HH:MM format (UTC)"),
});

export const createRestaurantSchema = restaurantBase.refine(
  (data) => data.openingTime < data.closingTime,
  {
    message: "Opening time must be before closing time",
    path: ["closingTime"],
  },
);

export const updateRestaurantSchema = restaurantBase.partial().superRefine(
  (data, ctx) => {
    const open = data.openingTime;
    const close = data.closingTime;
    if (open !== undefined && close !== undefined && open >= close) {
      ctx.addIssue({
        code: "custom",
        message: "Opening time must be before closing time",
        path: ["closingTime"],
      });
    }
  },
);

export const createRestaurantAdminSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      "Include uppercase, lowercase, and a number",
    ),
});

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type CreateRestaurantAdminInput = z.infer<
  typeof createRestaurantAdminSchema
>;
