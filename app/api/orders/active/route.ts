import { apiError, apiSuccess, getServerUser } from "@/lib/server-api";

function isResponse(e: unknown): e is Response {
  return e instanceof Response;
}

/** Student: single in-progress order (not collected / cancelled). */
export async function GET() {
  try {
    const { supabase, user } = await getServerUser();

    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("student_id", user.id)
      .not("status", "in", "(collected,cancelled)")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return apiError("Failed to fetch active order", 500);
    }

    return apiSuccess({ order: data ?? null });
  } catch (e) {
    if (isResponse(e)) return e;
    return apiError("Failed to fetch active order", 500);
  }
}
