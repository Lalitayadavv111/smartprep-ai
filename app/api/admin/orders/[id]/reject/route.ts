import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser, apiError, apiSuccess } from "@/lib/server-api";

type RejectOrderRow = { refunded: boolean; amount: number };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await getAdminUser();

  const { id } = await params;
  const supabase = await createClient();

  const rpcClient = supabase as typeof supabase & {
    rpc: (
      fn: "reject_order_and_refund",
      args: { p_order_id: string },
    ) => Promise<{
      data: RejectOrderRow[] | null;
      error: { message: string } | null;
    }>;
  };

  const { data, error } = await rpcClient.rpc("reject_order_and_refund", {
    p_order_id: id,
  });

  if (error) {
    if (error.message.includes("ORDER_NOT_FOUND")) {
      return apiError("Order not found", 404);
    }
    if (error.message.includes("INVALID_STATE")) {
      return apiError(
        "Cannot cancel order in current status",
        400,
        "INVALID_STATE",
      );
    }
    return apiError("Refund failed", 500);
  }

  const row = Array.isArray(data) ? data[0] : null;

  if (!row) {
    return apiError("Refund failed", 500);
  }

  return apiSuccess({
    refunded: row.refunded,
    amount: row.amount,
  });
}