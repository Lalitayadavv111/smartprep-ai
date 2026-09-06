import { NextRequest } from "next/server";

import { razorpay } from "@/lib/razorpay";
import { checkRateLimit, walletLimiter } from "@/lib/redis";
import { apiError, apiSuccess, getServerUser } from "@/lib/server-api";
import { topupSchema } from "@/lib/validations/wallet";

function isResponse(e: unknown): e is Response {
  return e instanceof Response;
}

/** Student: create Razorpay order for wallet top-up. */
export async function POST(req: NextRequest) {
  try {
    const { user } = await getServerUser();
    await checkRateLimit(walletLimiter, user.id);

    const body = await req.json();
    const parsed = topupSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid amount (₹50–₹2,000)", 400, "VALIDATION_ERROR");
    }

    const { amount } = parsed.data;
    
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `wp_${user.id.slice(0, 8)}_${Date.now().toString().slice(-8)}`,
    });

    return apiSuccess({
      razorpay_order_id: order.id,
      amount: order.amount,
      currency: "INR",
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (e) {
    if (isResponse(e)) return e;
    console.error('RAZORPAY ERROR:', JSON.stringify(e, null, 2))
    console.error('RAZORPAY ERROR raw:', e)
    return apiError("Failed to create order", 500);
  }
}
