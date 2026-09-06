import { type NextRequest } from "next/server";
import { z } from "zod";

import { getAdminUser, apiSuccess, apiError } from "@/lib/server-api";
import type { Order, OrderStatus } from "@/lib/types/database";

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  scheduled: ["placed", "cancelled"],  // ← add this line
  placed: ["preparing"],
  preparing: ["ready"],
  ready: ["collected"],
  collected: [],
  cancelled: [],
  
};

const bodySchema = z.object({
  status: z.enum(["scheduled", "placed", "preparing", "ready", "collected", "cancelled"]),  // ← add scheduled
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await getAdminUser();
    const { id: orderId } = await params;

    const body: unknown = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid request body", 400, "VALIDATION_ERROR");
    }

    const newStatus = parsed.data.status as OrderStatus;

    const { data: orderRow, error: fetchError } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();

    if (fetchError || !orderRow) {
      return apiError("Order not found", 404);
    }

    const currentStatus = (orderRow as { status: OrderStatus }).status;

    if (!VALID_TRANSITIONS[currentStatus].includes(newStatus)) {
      return apiError("Invalid status transition", 400, "INVALID_TRANSITION");
    }

    // Manual Database type lacks __InternalSupabase, so Supabase infers the
    // update payload type as never here.
    const { data: updated, error: updateError } = await supabase
      .from("orders")
    
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .select()
      .single();

    if (updateError || !updated) {
      return apiError("Failed to update order", 500);
    }

    return apiSuccess({ order: updated as Order });
  } catch (error) {
    if (error instanceof Response) return error;
    return apiError("Internal server error", 500);
  }
}