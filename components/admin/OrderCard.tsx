"use client";

import { useEffect, useState } from "react";

import type { Order, OrderItem } from "@/lib/types/database";

export type AdminOrder = Order & {
  student_name: string | null;
  items: OrderItem[];
};

interface OrderCardProps {
  order: AdminOrder;
  onStatusUpdate: (id: string, newStatus: string) => Promise<void>;
  onActivateSlot?: (slotDatetime: string) => Promise<void>;
  onCancelOrder?: (id: string) => Promise<void>;
}

const STATUS_ACTIONS: Partial<
  Record<string, { label: string; next: string; className: string }>
> = {
  placed: {
    label: "Start Preparing",
    next: "preparing",
    className: "bg-[#F97316] text-white hover:bg-orange-600",
  },
  preparing: {
    label: "Mark Ready",
    next: "ready",
    className: "bg-[#EAB308] text-white hover:bg-yellow-600",
  },
  ready: {
    label: "Mark Collected",
    next: "collected",
    className: "bg-[#22C55E] text-white hover:bg-green-600",
  },
};

function getTimeSince(dateStr: string): string {
  const diffMins = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 60000,
  );
  if (diffMins < 1) return "just now";
  return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
}

export function OrderCard({ order, onStatusUpdate, onActivateSlot, onCancelOrder }: OrderCardProps) {
  const [timeSince, setTimeSince] = useState(() =>
    getTimeSince(order.created_at),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(
      () => setTimeSince(getTimeSince(order.created_at)),
      60000,
    );
    return () => clearInterval(intervalId);
  }, [order.created_at]);

  const isLate =
    order.status === "placed" &&
    Date.now() - new Date(order.created_at).getTime() > 10 * 60 * 1000;

  const action = STATUS_ACTIONS[order.status];

  const itemsText = order.items
    .map((i) => `${i.quantity}× ${i.item_name}`)
    .join(", ");

  const firstName = order.student_name?.split(" ")[0] ?? "—";

  const tokenLabel =
    order.token_label ??
    `T-${String(order.token_number ?? 0).padStart(3, "0")}`;
  const isCod = (order as AdminOrder & { payment_method?: string }).payment_method === "cod";

  async function handleClick() {
    if (!action) return;
    setIsLoading(true);
    try {
      await onStatusUpdate(order.id, action.next);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleActivateSlot() {
    if (!order.scheduled_for || !onActivateSlot) return;
    setIsLoading(true);
    try {
      await onActivateSlot(order.scheduled_for);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCancel() {
    if (!onCancelOrder) return;
    setIsCancelling(true);
    try {
      await onCancelOrder(order.id);
    } finally {
      setIsCancelling(false);
    }
  }

  const scheduledLabel = order.scheduled_for
    ? new Date(order.scheduled_for).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  const spinnerContent = (
    <span className="flex items-center justify-center gap-2">
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
      </svg>
      Updating…
    </span>
  );

  return (
    <div
      className={`rounded-xl border bg-card p-4 shadow-sm ${
        order.status === "scheduled"
          ? "border-blue-400 ring-1 ring-blue-400"
          : isLate
            ? "border-red-500 ring-1 ring-red-500"
            : "border-border"
      } border-l-[3px] border-l-[#E7A355]`}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        {order.status === "scheduled" ? (
          <span className="text-[22px] font-semibold text-blue-400">
            {scheduledLabel ?? "Scheduled"}
          </span>
        ) : (
          <span className="text-[22px] font-semibold leading-none text-black">
            {tokenLabel}
          </span>
        )}
        <span
          className={
            isLate
              ? "text-xs font-medium text-red-500"
              : "text-xs font-medium text-[#6B4F3A]/75"
          }
        >
          {isLate && "⚠ "}
          {timeSince}
        </span>
        {isCod && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">
            COD
          </span>
        )}
      </div>
      <div className="mb-3 text-sm font-medium text-[#6B4F3A]/85">
        {firstName}
      </div>
      <p className="mb-2 text-sm text-foreground">{itemsText || "—"}</p>
      <div className="mb-3 border-y border-[#92400E]/15 py-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-[#6B4F3A]/75">
            Total
          </span>
          <span className="font-medium text-[#C87941]">₹{order.total_amount}</span>
        </div>
      </div>

      <>
        {order.status === "scheduled" && onActivateSlot ? (
          <button
            onClick={() => void handleActivateSlot()}
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-60"
          >
            {isLoading ? spinnerContent : "Activate Slot"}
          </button>
        ) : (
          action && (
            <button
              onClick={() => void handleClick()}
              disabled={isLoading}
              className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${action.className}`}
            >
              {isLoading ? spinnerContent : action.label}
            </button>
          )
        )}
        {["scheduled", "placed", "preparing", "ready"].includes(order.status) &&
          onCancelOrder && (
            <button
              onClick={() => void handleCancel()}
              disabled={isCancelling || isLoading}
              className="mt-2 w-full rounded-xl border border-[#F0C4B4] bg-transparent px-4 py-2.5 text-sm font-medium text-[#B94A2A] transition-colors hover:bg-[#FFF5F2] disabled:opacity-60"
            >
              {isCancelling ? spinnerContent : "Cancel & Refund"}
            </button>
          )}
      </>
    </div>
  );
}
