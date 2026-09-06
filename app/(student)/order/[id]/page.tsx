import { OrderTracker } from "@/components/student/TokenDisplay";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/lib/types/database";

type OrderWithItems = Order & { items: OrderItem[] };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold">Order not found</h1>
      </div>
    );
  }

  const { data: row, error } = await supabase
    .from("orders")
    .select("*, order_items (*)")
    .eq("id", id)
    .eq("student_id", user.id)
    .single();

  if (error || !row) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold">Order not found</h1>
      </div>
    );
  }

  const { order_items: orderItemsRaw, ...orderFields } = row as Order & {
    order_items: OrderItem[] | null;
  };

  const items = orderItemsRaw ?? [];

  const initialOrder: OrderWithItems = {
    ...(orderFields as Order),
    items,
  };

  return (
    <div className="space-y-6">
      <h1 className="flex items-center justify-center gap-2 text-2xl font-semibold tracking-tight text-[#3D2B1F]">
        <span className="inline-block w-1 h-6 rounded-full bg-[#F97316]" />
        Order status
      </h1>
      <OrderTracker key={id} initialOrder={initialOrder} />
    </div>
  );
}
