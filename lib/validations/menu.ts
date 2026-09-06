import { z } from "zod";

export const menuItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  price: z.number().min(0.01),
  category_id: z.string().uuid(),
  image_url: z.string().url().optional(),
  is_available: z.boolean(),
});

export const updateMenuItemSchema = menuItemSchema.partial();
