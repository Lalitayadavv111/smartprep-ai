import { z } from "zod";

export const orderItemSchema = z.object({
  menu_item_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(10),
});

export const placeOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1).max(20),
  notes: z.string().max(200).optional(),
  scheduled_for: z.string().datetime({ offset: true }).optional(),
  payment_method: z.enum(["wallet", "cod"]).default("wallet"),
});