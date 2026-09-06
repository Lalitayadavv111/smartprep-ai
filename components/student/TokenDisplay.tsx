"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { tokenPop } from "@/lib/animations";
import {
  CalendarClockIcon,
  CheckIcon,
  ChefHatIcon,
  ClipboardListIcon,
  PackageCheckIcon,
  UtensilsCrossedIcon,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { subscribeToOrderUpdates } from "@/lib/supabase/realtime";
import type { Order, OrderItem } from "@/lib/types/database";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Placed", Icon: ClipboardListIcon },
  { label: "Preparing", Icon: ChefHatIcon },
  { label: "Ready", Icon: UtensilsCrossedIcon },
  { label: "Collected", Icon: PackageCheckIcon },
] as const;

export type OrderWithItems = Order & { items: OrderItem[] };

function stepState(
  status: Order["status"],
  stepIndex: number,
): "completed" | "current" | "future" {
  if (status === "collected") return "completed";
  if (status === "cancelled") return "future";

  const currentByStatus: Partial<Record<Order["status"], number>> = {
    placed: 0,
    preparing: 1,
    ready: 2,
  };

  const current = currentByStatus[status] ?? 0;
  if (stepIndex < current) return "completed";
  if (stepIndex === current) return "current";
  return "future";
}

export function TokenDisplay({
  tokenLabel,
  status,
  scheduledFor,
  items,
}: {
  tokenLabel: string | null;
  status: Order["status"];
  scheduledFor?: string | null;
  items?: OrderItem[];
}) {
  if (status === "scheduled") {
    const slotLabel = scheduledFor
      ? new Date(scheduledFor).toLocaleString("en-IN", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : null;

    return (
      <div className="flex flex-col items-center gap-8">
        <div className="w-full max-w-md rounded-2xl border-2 border-[#3D2B1F]/30 bg-[#FDFAF7] px-6 py-10">
          <div className="mb-4 flex justify-center">
            <CalendarClockIcon className="size-16 text-[#3D2B1F]" />
          </div>
          <p className="text-center text-xl font-semibold text-[#3D2B1F]">
            Order Scheduled
          </p>
          {slotLabel && (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {slotLabel}
            </p>
          )}
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Your token will be assigned when the café activates this slot.
          </p>
          <div className="mt-6 flex justify-center">
            <a href="/menu" className="text-sm font-medium text-[#3D2B1F] underline-offset-4 hover:underline">
              {"← Back to menu"}
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="flex flex-col items-center gap-8">
        <div className="w-full max-w-md rounded-2xl border-2 border-red-400/40 bg-[#FDFAF7] px-6 py-10">
          <div className="mb-4 flex justify-center">
            <UtensilsCrossedIcon className="size-16 text-red-400" />
          </div>
          <p className="text-center text-xl font-semibold text-foreground">
            Order Cancelled
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {"We're sorry for the inconvenience."}
          </p>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Your wallet has been refunded.
          </p>
          <div className="mt-6 flex justify-center">
            <a href="/menu" className="text-sm font-medium text-[#3D2B1F] underline-offset-4 hover:underline">
              {"← Back to menu"}
            </a>
          </div>
        </div>
      </div>
    );
  }

  const borderClass =
    status === "placed"
      ? "border-[#3D2B1F]/40"
      : status === "preparing"
        ? "border-yellow-500/60"
        : status === "ready"
          ? "border-green-500 shadow-[0_0_24px_rgba(34,197,94,0.45)]"
          : "border-muted-foreground/20";

  const bgClass =
    status === "placed"
      ? "bg-[#FDFAF7]"
      : status === "preparing"
        ? "bg-[#FFFBEB]"
        : status === "ready"
          ? "bg-[#F0FDF4]"
          : status === "collected"
            ? "bg-[#F0FDF4]/60"
          : "bg-[#FDFAF7]";

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={cn(
          "w-full max-w-md rounded-2xl border-2 px-6 py-8 transition-[border-color,background-color,box-shadow] duration-500",
          borderClass,
          bgClass,
        )}
      >
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-[#92400E]">
          Your token
        </p>
        <motion.p
          className="text-center text-6xl font-bold tracking-tight sm:text-8xl"
          variants={tokenPop as Variants}
          initial="hidden"
          animate="visible"
        >
          {tokenLabel}
        </motion.p>
        <p
          className={cn(
            "mt-4 text-center text-sm font-medium transition-all duration-300",
            status === "placed" && "text-[#6B4F3A]",
            status === "preparing" && "text-yellow-600",
            status === "ready" && "text-green-600 font-semibold",
            status === "collected" && "text-[#6B4F3A]",
          )}
        >
          {status === "placed" && "Order received — hang tight!"}
          {status === "preparing" && "Chef is working on your order..."}
          {status === "ready" && "Ready for collection! Come grab it 🎉"}
          {status === "collected" && "Enjoy your meal! 🍽️"}
        </p>
      <div className="mt-6 border-t border-[#92400E]/10 pt-6">
        <ol className="flex items-start justify-between gap-0">
          {STEPS.map((step, i) => {
            const state = stepState(status, i);
            const Icon = step.Icon;
            const isLast = i === STEPS.length - 1;
            return (
              <motion.li
                key={step.label}
                className="flex flex-1 flex-col items-center gap-2 text-center"
                initial="hidden"
                animate="visible"
                transition={{ type: "spring", stiffness: 300, damping: 28, delay: i * 0.08 }}
              >
                <div className="flex w-full items-center">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      state === "completed" &&
                        "border-[#3D2B1F] bg-[#3D2B1F] text-white",
                      state === "current" &&
                        "border-[#3D2B1F] bg-background text-[#3D2B1F] ring-2 ring-[#3D2B1F]/40 ring-offset-2 ring-offset-background animate-pulse",
                      state === "future" &&
                        "border-muted-foreground/30 bg-background text-muted-foreground",
                    )}
                  >
                    {state === "completed" ? (
                      <CheckIcon className="size-5" strokeWidth={2.5} />
                    ) : (
                      <Icon className="size-5" />
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={cn(
                        "h-[2px] flex-1 transition-all duration-500",
                        state === "completed"
                        ? "bg-[#3D2B1F]"
                        : "bg-muted-foreground/20",
                      )}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "max-w-[5.5rem] text-xs font-medium leading-tight",
                    state === "future"
                    ? "text-muted-foreground"
                    : "text-foreground",
                  )}
                >
                  {step.label}
                </span>
              </motion.li>
            );
          })}
        </ol>
      </div>
      </div>

      {items && items.length > 0 && (
        <div className="w-full max-w-md rounded-2xl border border-[#92400E]/15 bg-white/80 px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#92400E]">
            Your order
          </p>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-[#F97316] text-[10px] font-bold text-white">
                    {item.quantity}
                  </span>
                  <span className="text-sm font-medium text-[#3D2B1F]">
                    {item.item_name}
                  </span>
                </div>
                <span className="text-sm font-semibold text-[#F97316]">
                  ₹{Math.round(item.item_price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-[#92400E]/10 pt-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#92400E]">
              Total
            </span>
            <span className="text-sm font-bold text-[#3D2B1F]">
              ₹{Math.round(items.reduce((sum, i) => sum + i.item_price * i.quantity, 0))}
            </span>
          </div>

          {status === "collected" && (
            <div className="mt-4 border-t border-[#92400E]/10 pt-4">
              <a
                href="/menu"
                className="block w-full rounded-xl bg-[#F97316] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_4px_16px_rgba(249,115,22,0.35)] transition-all hover:bg-[#EA6C0A] active:scale-95"
              >
                Order again →
              </a>
            </div>
          )}
        </div>
      )}
      {status !== "collected" && (
        <div className="flex justify-center">
          <a href="/menu" className="text-sm font-medium text-[#3D2B1F] underline-offset-4 hover:underline">
            {"← Back to menu"}
          </a>
        </div>
      )}
    </div>
  );
}

export function OrderTracker({ initialOrder }: { initialOrder: OrderWithItems }) {
  const [order, setOrder] = useState<OrderWithItems>(initialOrder);
  const prevStatusRef = useRef(order.status);
  const supabase = useMemo(() => createClient(), []);

  async function refetchOrder() {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items (*)")
      .eq("id", initialOrder.id)
      .single();
    if (data) {
      const { order_items, ...rest } = data as Order & { order_items: OrderItem[] };
      setOrder({ ...(rest as Order), items: order_items ?? [] });
    }
  }

  useEffect(() => {
    const channel = subscribeToOrderUpdates(
      supabase,
      initialOrder.id,
      () => {
        void refetchOrder();
      },
    );

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialOrder.id, supabase]);

  useEffect(() => {
    if (order.status === "ready" && prevStatusRef.current !== "ready") {
      toast.success("Your order is ready! Come collect it.");
    }
    prevStatusRef.current = order.status;
  }, [order.status]);

  return (
    <TokenDisplay
      tokenLabel={order.token_label}
      status={order.status}
      scheduledFor={order.scheduled_for}
      items={order.items}
    />
  );
}