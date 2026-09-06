"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { staggerContainer, scaleIn } from "@/lib/animations";
import PageWrapper from "@/components/shared/PageWrapper";

import { toast } from "sonner";

import { AdminHelpWidget } from "@/components/admin/AdminHelpWidget";
import { OrderCard, type AdminOrder } from "@/components/admin/OrderCard";
import { createClient } from "@/lib/supabase/client";
import { subscribeToAdminOrders } from "@/lib/supabase/realtime";
import type { OrderStatus } from "@/lib/types/database";

const COLUMNS: { status: OrderStatus; label: string }[] = [
  { status: "placed", label: "Placed" },
  { status: "preparing", label: "Preparing" },
  { status: "ready", label: "Ready" },
];

const COLUMN_HEADER_ACCENT: Record<OrderStatus, string> = {
  scheduled: "border-l-[#7C9CB8]",
  placed: "border-l-[#EAB308]",
  preparing: "border-l-[#F97316]",
  ready: "border-l-[#22C55E]",
  collected: "border-l-[#92400E]",
  cancelled: "border-l-[#6B4F3A]",
};

function playPing() {
  if (typeof window === "undefined") return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 520;        // ← lower = softer tone (was 880)
  gain.gain.value = 0.3;            // ← volume 0-1 (1 is full blast)
  osc.type = "sine";                // ← sine is smoother than default square
  osc.start();
  osc.stop(ctx.currentTime + 0.2);  // ← slightly longer fade
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<{
    orders_today: number;
    revenue_today: number;
    top_items: { name: string; qty: number }[];
  } | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      
      
      const json = (await res.json()) as { data: { orders: AdminOrder[] } };
      setOrders(json.data?.orders ?? []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });      const json = (await res.json()) as {
        data?: {
          orders_today: number;
          revenue_today: number;
          top_items: { name: string; qty: number }[];
        };
      };
      if (json.data) {
        setStats(json.data);
      }
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let isActive = true;
    let channel: ReturnType<typeof subscribeToAdminOrders> | null = null;

    void fetchOrders();
    void fetchStats();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isActive) {
        return;
      }

      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }

      channel = subscribeToAdminOrders(
        supabase,
        ({ eventType, order }) => {
          if (eventType === "INSERT") {
            playPing();
            void fetchOrders();
            void fetchStats();
          } else if (eventType === "UPDATE") {
            setOrders((prev) => {
              if (order.status === "cancelled" || order.status === "collected") {
                return prev.filter((o) => o.id !== order.id);
              }
            
              return prev.map((o) =>
                o.id === order.id
                  ? { ...o, status: order.status, updated_at: order.updated_at }
                  : o,
              );
            });
            if (order.status === "placed") {
              void fetchOrders();
            }
            void fetchStats();
          }
        },
      );
    });

    return () => {
      isActive = false;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [fetchOrders, fetchStats]);

  const handleStatusUpdate = useCallback(
    async (id: string, newStatus: string): Promise<void> => {
      const previous = orders.find((o) => o.id === id);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, status: newStatus as OrderStatus } : o,
        ),
      );
      try {
        const res = await fetch(`/api/admin/orders/${id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) throw new Error("Update failed");
        await fetchStats();
      } catch {
        if (previous) {
          setOrders((prev) => prev.map((o) => (o.id === id ? previous : o)));
        }
        toast.error("Failed to update order status");
      }
    },
    [fetchStats, orders],
  );

  const handleCancelOrder = useCallback(
    async (id: string): Promise<void> => {
      try {
        const res = await fetch(`/api/admin/orders/${id}/reject`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("Cancel failed");
        toast.success("Order cancelled and wallet refunded");
        setOrders((prev) => prev.filter((o) => o.id !== id));
        await fetchStats();
      } catch {
        toast.error("Failed to cancel order");
      }
    },
    [fetchStats],
  );

  return (
    <PageWrapper variant='fade'>
    <main className="relative flex-1 min-h-screen p-4 md:p-6 text-[#3D2B1F]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[#EED6BB]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[url('/w2.png')] bg-cover bg-center bg-no-repeat opacity-65" />
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-[#3D2B1F]">Order Queue</h1>
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
        </span>
      </div>

      {/* Stats bar */}
      <div className="mb-6 space-y-3">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {/* Orders today */}
          <div className="rounded-xl border border-[#92400E]/15 border-t-[3px] border-t-[#92400E] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B4F3A]">Orders today</p>
            {stats === null ? (
              <div className="relative mt-2 h-5 w-[60px] overflow-hidden rounded-md bg-[#F0E5D6]">
                <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70" style={{ animation: "shimmer 1.5s linear infinite" }} />
              </div>
            ) : (
              <p className="mt-1 text-2xl font-bold text-[#3D2B1F]">{stats.orders_today}</p>
            )}
          </div>
          {/* Revenue today */}
          <div className="rounded-xl border border-[#92400E]/15 border-t-[3px] border-t-[#F97316] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B4F3A]">Revenue today</p>
            {stats === null ? (
              <div className="relative mt-2 h-5 w-[60px] overflow-hidden rounded-md bg-[#F0E5D6]">
                <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70" style={{ animation: "shimmer 1.5s linear infinite" }} />
              </div>
            ) : (
              <p className="mt-1 text-2xl font-bold text-orange-600">
                {`₹${stats.revenue_today.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
            )}
          </div>
          {/* Avg order value */}
          <div className="rounded-xl border border-[#92400E]/15 border-t-[3px] border-t-[#EAB308] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B4F3A]">Avg order value</p>
            {stats === null ? (
              <div className="relative mt-2 h-5 w-[60px] overflow-hidden rounded-md bg-[#F0E5D6]">
                <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70" style={{ animation: "shimmer 1.5s linear infinite" }} />
              </div>
            ) : (
              <p className="mt-1 text-2xl font-bold text-[#3D2B1F]">
                {stats.orders_today === 0
                  ? "₹0.00"
                  : `₹${(stats.revenue_today / stats.orders_today).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
            )}
          </div>
          {/* Pending now — computed from live orders state */}
          <div className="rounded-xl border border-[#92400E]/15 border-t-[3px] border-t-[#F97316] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B4F3A]">Pending now</p>
            {stats === null ? (
              <div className="relative mt-2 h-5 w-[60px] overflow-hidden rounded-md bg-[#F0E5D6]">
                <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70" style={{ animation: "shimmer 1.5s linear infinite" }} />
              </div>
            ) : (
              <p className="mt-1 text-2xl font-bold text-yellow-600">
                {orders.filter((o) => o.status === "placed" || o.status === "preparing").length}
              </p>
            )}
          </div>
        </div>
        {/* Top items strip */}
        <div className="rounded-xl border border-[#92400E]/15 bg-white px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B4F3A]">Top items today</p>
          {stats === null ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <span
                  key={`top-items-skeleton-${idx}`}
                  className="relative h-8 overflow-hidden rounded-full border border-[#D8C2AA] bg-[#F0E5D6]"
                  style={{ width: idx === 0 ? 110 : idx === 1 ? 132 : 96 }}
                >
                  <span
                    className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70"
                    style={{ animation: "shimmer 1.5s linear infinite" }}
                  />
                </span>
              ))}
            </div>
          ) : stats.top_items.length === 0 ? (
            <p className="py-2 text-center text-sm text-[#6B4F3A]/80">No data yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stats.top_items.map((item, i) => (
                <span
                  key={item.name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#C87941]/35 bg-[#F5E0CC] px-3.5 py-1.5 text-sm font-medium text-[#6B4F3A]"
                >
                  <span className="text-[#92400E]">#{i + 1}</span>
                  <span className="font-medium text-[#5B3A23]">{item.name}</span>
                  <span className="ml-1 rounded-full border border-[#C87941]/40 bg-[#F0CFAF] px-1.5 py-0.5 text-xs font-bold text-[#7A4A1E]">
                    {item.qty}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map(({ status, label }) => (
            <section key={status} className="flex flex-col gap-3">
              <h2 className={`rounded-md border-b border-l-[3px] border-[#92400E]/20 bg-[#FDF6EE]/75 px-2 py-1.5 text-sm font-bold uppercase tracking-wide text-[#6B4F3A] ${COLUMN_HEADER_ACCENT[status]}`}>
                {label}
              </h2>
              <div className="flex flex-col gap-3">
                {Array.from({ length: status === "scheduled" ? 1 : 2 }).map((_, idx) => (
                  <div key={`${status}-skeleton-${idx}`} className="rounded-xl border border-[#92400E]/15 bg-white p-4 shadow-sm">
                    <div className="relative mb-3 h-6 w-24 overflow-hidden rounded-md bg-[#F0E5D6]">
                      <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70" style={{ animation: "shimmer 1.5s linear infinite" }} />
                    </div>
                    <div className="relative mb-3 h-4 w-20 overflow-hidden rounded bg-[#F0E5D6]">
                      <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70" style={{ animation: "shimmer 1.5s linear infinite" }} />
                    </div>
                    <div className="relative mb-4 h-4 w-36 overflow-hidden rounded bg-[#F0E5D6]">
                      <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70" style={{ animation: "shimmer 1.5s linear infinite" }} />
                    </div>
                    <div className="flex gap-2">
                      <div className="relative h-9 flex-1 overflow-hidden rounded-xl bg-[#F0E5D6]">
                        <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70" style={{ animation: "shimmer 1.5s linear infinite" }} />
                      </div>
                      <div className="relative h-9 w-24 overflow-hidden rounded-xl bg-[#F0E5D6]">
                        <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70" style={{ animation: "shimmer 1.5s linear infinite" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map(({ status, label }) => {
            const columnOrders = orders.filter((o) => o.status === status);
            return (
              <section key={status} className="flex flex-col gap-3">
                <h2 className={`rounded-md border-b border-l-[3px] border-[#92400E]/20 bg-[#FDF6EE]/75 px-2 py-1.5 text-sm font-bold uppercase tracking-wide text-[#6B4F3A] ${COLUMN_HEADER_ACCENT[status]}`}>
                  {label} ({columnOrders.length})
                </h2>
                <motion.div
                  variants={staggerContainer as Variants}
                  initial='hidden'
                  animate='visible'
                  className="flex flex-col gap-3"
                >
                  {columnOrders.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[#92400E]/25 bg-white py-6 text-center text-[#6B4F3A]">
                      <div className="mx-auto mb-2 flex h-6 w-6 items-center justify-center rounded-full border border-[#92400E]/35 bg-white/70">
                        <span className="h-[2px] w-2.5 rounded-full bg-[#92400E]/60" />
                      </div>
                      <p className="text-sm">No orders</p>
                    </div>
                  ) : (
                    columnOrders.map((order) => (
                      <motion.div key={order.id} variants={scaleIn as Variants}>
                        <OrderCard
                          order={order}
                          onStatusUpdate={handleStatusUpdate}
                          onCancelOrder={handleCancelOrder}
                        />
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </section>
            );
          })}
        </div>
      )}
      <AdminHelpWidget orders={orders} stats={stats} />
    </main>
    </PageWrapper>
  );
}
