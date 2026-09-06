import { NextRequest } from "next/server";

import { razorpay, verifyPaymentSignature } from "@/lib/razorpay";
import { apiError, apiSuccess, getServerUser } from "@/lib/server-api";
import { verifyPaymentSchema } from "@/lib/validations/wallet";

function isResponse(e: unknown): e is Response {
  return e instanceof Response;
}

/** Student: verify Razorpay payment and credit wallet (idempotent). */
export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getServerUser();

    const body = await req.json();
    const parsed = verifyPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid payment data", 400, "VALIDATION_ERROR");
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      parsed.data;

    const valid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );
    if (!valid) {
      return apiError("Invalid payment signature", 400, "INVALID_SIGNATURE");
    }

    const { data: existing } = await supabase
      .from("wallet_transactions")
      .select("id")
      .eq("reference_id", razorpay_payment_id)
      .eq("student_id", user.id)
      .maybeSingle();

    if (existing) {
      return apiError("Payment already processed", 409, "DUPLICATE_PAYMENT");
    }

    const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
const amountPaise = Number(rzpOrder.amount);

if (!Number.isFinite(amountPaise)) {
  return apiError("Invalid payment amount from Razorpay", 500);
}

const amount = amountPaise / 100;

const { data: newBalance, error: rpcError } = await supabase.rpc(
  "credit_wallet",
  {
    p_student_id: user.id,
    p_amount: amount,
    p_reference_id: razorpay_payment_id,
    p_description: "Wallet top-up via Razorpay",
  },
);

    if (rpcError) {
      return apiError("Failed to credit wallet", 500);
    }

    return apiSuccess({ success: true, new_balance: newBalance });
  } catch (e) {
    if (isResponse(e)) return e;
    return apiError("Payment verification failed", 500);
  }
}