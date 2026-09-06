"use client";

import { useState } from "react";

import type { AdminOrder } from "@/components/admin/OrderCard";

type Stats = {
  orders_today: number;
  revenue_today: number;
  top_items: { name: string; qty: number }[];
} | null;

type Question =
  | "pending"
  | "stages"
  | "delayed"
  | "scheduled_meaning"
  | "reject_effect"
  | "top_items";

const QUESTIONS: { id: Question; label: string }[] = [
  { id: "pending",           label: "How many pending orders are there now?" },
  { id: "stages",            label: "How many orders are in each stage?" },
  { id: "delayed",           label: "Are any orders delayed?" },
  { id: "scheduled_meaning", label: "What does scheduled mean?" },
  { id: "reject_effect",     label: "What happens if I reject a scheduled order?" },
  { id: "top_items",         label: "What are today's top items?" },
];

function deriveAnswer(
  q: Question,
  orders: AdminOrder[],
  stats: Stats,
): string {
  switch (q) {
    case "pending": {
      const count = orders.filter(
        (o) => o.status === "placed" || o.status === "preparing",
      ).length;
      return count === 0
        ? "No pending orders right now."
        : `${count} order${count === 1 ? "" : "s"} pending (placed or preparing).`;
    }
    case "stages": {
      const s = (status: string) =>
        orders.filter((o) => o.status === status).length;
      return (
        `Scheduled: ${s("scheduled")}, ` +
        `Placed: ${s("placed")}, ` +
        `Preparing: ${s("preparing")}, ` +
        `Ready: ${s("ready")}.`
      );
    }
    case "delayed": {
      const now = Date.now();
      const delayed = orders.filter((o) => {
        if (o.status !== "placed") return false;
        const age = now - new Date(o.created_at).getTime();
        return age > 10 * 60 * 1000;
      });
      return delayed.length === 0
        ? "No placed orders are delayed beyond 10 minutes."
        : `${delayed.length} placed order${delayed.length === 1 ? "" : "s"} have been waiting more than 10 minutes.`;
    }
    case "scheduled_meaning":
      return (
        "Scheduled orders are placed for a future pickup slot. " +
        "They stay in the Scheduled column until you activate that slot, " +
        "at which point they move into the live queue as Placed orders."
      );
    case "reject_effect":
      return (
        "Rejecting or cancelling an order removes it from the queue " +
        "and automatically refunds the full amount to the customer's wallet."
      );
    case "top_items": {
      const items = stats?.top_items?.slice(0, 5);
      if (!items || items.length === 0)
        return "No top-item data available yet for today.";
      return (
        items.map((item, i) => `#${i + 1} ${item.name} (${item.qty} sold)`).join(", ") + "."
      );
    }
  }
}

interface AdminHelpWidgetProps {
  orders: AdminOrder[];
  stats: Stats;
}

export function AdminHelpWidget({ orders, stats }: AdminHelpWidgetProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Question | null>(null);

  const answer = selected ? deriveAnswer(selected, orders, stats) : null;

  return (
<div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }} className="flex flex-col items-end gap-3">
{open && (
        <div className="w-80 rounded-xl border bg-card shadow-lg flex flex-col overflow-hidden max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="bg-primary px-4 py-3 flex items-center justify-between">
            <span className="font-semibold text-primary-foreground text-sm">
              Admin Help
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-primary-foreground/70 hover:text-primary-foreground text-lg leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              I can help with queue status, delayed orders, scheduled orders,
              refunds, and top items.
            </p>
            <p className="text-xs text-muted-foreground">
              Choose a question below for a quick answer.
            </p>
            <div className="flex flex-col gap-1.5">
              {QUESTIONS.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setSelected(q.id)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                    selected === q.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-muted text-foreground"
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
            {answer && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                <p className="text-xs leading-relaxed text-foreground">
                  {answer}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3D2B1F] text-primary-foreground shadow-lg transition-colors text-xl hover:bg-[#5A3E2B]"
        aria-label="Admin Help"
      >
        ?
      </button>
    </div>
  );
}
