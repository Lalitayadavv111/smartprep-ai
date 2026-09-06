import { z } from "zod";

export const topupSchema = z.object({
  amount: z.number().min(50).max(2000),
});

export const verifyPaymentSchema = z.object({
  razorpay_payment_id: z.string(),
  razorpay_order_id: z.string(),
  razorpay_signature: z.string(),
});
