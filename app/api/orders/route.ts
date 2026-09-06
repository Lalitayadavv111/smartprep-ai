import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

import { apiError, apiSuccess, getServerUser } from "@/lib/server-api";
import { checkRateLimit, orderLimiter } from "@/lib/redis";
import { placeOrderSchema } from "@/lib/validations/order";

function isResponse(e: unknown): e is Response {
  return e instanceof Response;
}

/** Student: place order (RPC) or list order history. */
export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getServerUser();
    await checkRateLimit(orderLimiter, user.id);

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return apiError("Invalid request", 400);
    }

    const parsed = placeOrderSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("Invalid request", 400);
    }

    const { items, notes, scheduled_for, payment_method } = parsed.data;

    if (scheduled_for) {
      const slotTime = new Date(scheduled_for);
      const now = new Date();
      const diff = slotTime.getTime() - now.getTime();
      if (diff < 30 * 60 * 1000)
        return apiError("Slot must be at least 30 minutes in the future", 400, "SLOT_TOO_SOON");
      if (diff > 7 * 24 * 60 * 60 * 1000)
        return apiError("Cannot book more than 7 days ahead", 400, "SLOT_TOO_FAR");
    }

    if (payment_method === "cod") {
    const sbCod = supabase as SupabaseClient<any>;
    const { data: codData, error: codError } = await sbCod.rpc("place_order_cod", {
      p_student_id: user.id,
      p_items: items,
      p_notes: notes ?? null,
    });
    if (codError) {
      const msg = codError.message ?? "";
      if (msg.includes("ITEM_NOT_AVAILABLE"))
        return apiError("One or more items are unavailable", 400, "ITEM_NOT_AVAILABLE");
      if (msg.includes("INVALID_ITEMS"))
        return apiError("Invalid items in order", 400, "INVALID_ITEMS");
      return apiError("Failed to place order", 500);
    }
    const rawCod = Array.isArray(codData) ? codData[0] : codData;
    if (!rawCod || typeof rawCod !== "object")
      return apiError("Failed to place order", 500);
    const codRow = rawCod as {
      order_id: string;
      token_label: string | null;
      total_amount: number;
      status: string;
    };
    return apiSuccess({
      order_id: codRow.order_id,
      token_label: codRow.token_label,
      total_amount: codRow.total_amount,
      new_balance: null,
      payment_method: "cod",
      status: codRow.status,
    });
  }

  const sb = supabase as SupabaseClient<any>;
    const { data, error } = await sb.rpc("place_order", {
      p_student_id: user.id,
      p_items: items,
      p_notes: notes ?? null,
      p_scheduled_for: scheduled_for ?? null,
    });

    if (error) {
      const msg = error.message ?? "";
      if (msg.includes("INSUFFICIENT_BALANCE")) {
        return apiError(
          "Insufficient wallet balance",
          402,
          "INSUFFICIENT_BALANCE",
        );
      }
      if (msg.includes("ITEM_NOT_AVAILABLE")) {
        return apiError(
          "One or more items are unavailable",
          400,
          "ITEM_NOT_AVAILABLE",
        );
      }
      if (msg.includes("INVALID_ITEMS")) {
        return apiError("Invalid items in order", 400, "INVALID_ITEMS");
      }
      return apiError("Failed to place order", 500);
    }

    const raw = Array.isArray(data) ? data[0] : data;
    if (!raw || typeof raw !== "object") {
      return apiError("Failed to place order", 500);
    }

    const row = raw as {
      order_id: string;
      token_label: string | null;
      total_amount: number;
      new_balance: number;
      scheduled_for: string | null;
      status: string;
    };

    return apiSuccess({
      order_id: row.order_id,
      token_label: row.token_label,
      total_amount: row.total_amount,
      new_balance: row.new_balance,
      scheduled_for: row.scheduled_for,
      status: row.status,
      payment_method: "wallet",
    });
  } catch (e) {
    if (isResponse(e)) return e;
    return apiError("Failed to place order", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await getServerUser();

    const { searchParams } = new URL(req.url);
    const pageRaw = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    let limitRaw = Number.parseInt(searchParams.get("limit") ?? "20", 10);
    if (!Number.isFinite(limitRaw) || limitRaw < 1) limitRaw = 20;
    const limit = Math.min(50, limitRaw);
    const offset = (page - 1) * limit;

    const { count, error: countError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("student_id", user.id);

    if (countError) {
      return apiError("Failed to fetch orders", 500);
    }

    const total = count ?? 0;

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (ordersError) {
      return apiError("Failed to fetch orders", 500);
    }

    return apiSuccess({
      orders: orders ?? [],
      total,
      page,
      limit,
      hasMore: total > page * limit,
    });
  } catch (e) {
    if (isResponse(e)) return e;
    return apiError("Failed to fetch orders", 500);
  }
}
