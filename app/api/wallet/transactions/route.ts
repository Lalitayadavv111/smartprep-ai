import type { SupabaseClient } from "@supabase/supabase-js";

import { apiError, apiSuccess, getServerUser } from "@/lib/server-api";

function isResponse(e: unknown): e is Response {
  return e instanceof Response;
}

/** Student: wallet ledger entries. */
export async function GET() {
  try {
    const { supabase, user } = await getServerUser();
    const sb = supabase as SupabaseClient<any>;

    const { data, error } = await sb
      .from("wallet_transactions")
      .select("*")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return apiError("Failed to fetch transactions", 500);
    }

    return apiSuccess({ transactions: data });
  } catch (e) {
    if (isResponse(e)) return e;
    return apiError("Failed to fetch transactions", 500);
  }
}
