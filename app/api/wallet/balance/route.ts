import type { Database } from "@/lib/types/database";

import { apiError, apiSuccess, getServerUser } from "@/lib/server-api";

function isResponse(e: unknown): e is Response {
  return e instanceof Response;
}

type WalletBalanceRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "wallet_balance"
>;

/** Student: current wallet balance. */
export async function GET() {
  try {
    const { supabase, user } = await getServerUser();

    const { data, error } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    const row = data as WalletBalanceRow | null;

    if (error || !row) {
      return apiError("Failed to fetch balance", 500);
    }

    return apiSuccess({ balance: row.wallet_balance });
  } catch (e) {
    if (isResponse(e)) return e;
    return apiError("Failed to fetch balance", 500);
  }
}