import type { NextRequest } from "next/server";

import { apiError, apiSuccess, getServerUser } from "@/lib/server-api";

function isResponse(e: unknown): e is Response {
  return e instanceof Response;
}

/** Student: paginated order history with items. */
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

    if (countError) return apiError("Failed to fetch order history", 500);

    const total = count ?? 0;

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (ordersError) return apiError("Failed to fetch order history", 500);

    return apiSuccess({
      orders: orders ?? [],
      total,
      page,
      limit,
      hasMore: total > page * limit,
    });
  } catch (e) {
    if (isResponse(e)) return e;
    return apiError("Failed to fetch order history", 500);
  }
}
