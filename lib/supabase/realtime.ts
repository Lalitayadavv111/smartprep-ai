import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database.generated";
import type { Order } from "@/lib/types/database";

export function subscribeToAdminOrders(
  supabase: SupabaseClient<Database>,
  callback: (payload: { eventType: string; order: Order }) => void,
): RealtimeChannel {
  const channel = supabase
    .channel("admin-orders-" + Date.now())
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      (payload) => {
        console.log("admin realtime event:", payload.eventType, payload.new);
        callback({
          eventType: payload.eventType,
          order: payload.new as Order,
        });
      },
    )
    .subscribe((status, err) => {
      console.log("admin realtime status:", status, err);
    });

  return channel;
}

export function subscribeToOrderUpdates(
  supabase: SupabaseClient<Database>,
  orderId: string,
  callback: (order: Order) => void,
): RealtimeChannel {
  const channel = supabase
    .channel("order-" + orderId + "-" + Date.now())
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: "id=eq." + orderId,
      },
      (payload) => {
        callback(payload.new as Order);
      },
    )
    .subscribe();

  return channel;
}