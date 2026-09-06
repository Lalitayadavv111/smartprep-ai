import { getAdminUser, apiError, apiSuccess } from "@/lib/server-api";

export async function GET() {
  try {
    const { supabase } = await getAdminUser();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("orders")
      .select("id, total_amount, order_items(item_name, quantity)")
      .neq("status", "cancelled")
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString());

    if (error) {
      return apiError("Failed to fetch stats", 500);
    }

    const orders = (data ?? []) as {
      id: string;
      total_amount: number;
      order_items: { item_name: string; quantity: number }[];
    }[];

    const orders_today = orders.length;
    const revenue_today = orders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);

    const itemMap = new Map<string, number>();
    for (const order of orders) {
      for (const item of order.order_items ?? []) {
        itemMap.set(item.item_name, (itemMap.get(item.item_name) ?? 0) + item.quantity);
      }
    }

    const top_items = [...itemMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));

    return apiSuccess({ orders_today, revenue_today, top_items });
  } catch (err) {
    if (err instanceof Response) return err;
    return apiError("Internal server error", 500);
  }
}
