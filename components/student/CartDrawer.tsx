"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MinusIcon, PlusIcon, WalletIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { cn } from "@/lib/utils";
import useCartStore, { useCartTotal } from "@/store/cart";

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CartDrawer() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const open = useCartStore((s) => s.cartDrawerOpen);
  const setOpen = useCartStore((s) => s.setCartDrawerOpen);
  const subtotal = useCartTotal();
  const [notes, setNotes] = useState("");
  const balance = useWalletBalance(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "cod">("wallet");

  const totalItemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const isEmpty = items.length === 0;
  const shortfall =
    balance !== null && subtotal > balance ? subtotal - balance : 0;
  const insufficient = balance !== null && subtotal > balance;

  async function handlePlaceOrder() {
    if (isEmpty || (paymentMethod === "wallet" && insufficient)) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            menu_item_id: i.id,
            quantity: i.quantity,
          })),
          notes: notes.trim() || undefined,
          payment_method: paymentMethod,
        }),
      });

      const body: unknown = await res.json().catch(() => null);

      if (res.ok) {
        const rawData =
          body &&
          typeof body === "object" &&
          "data" in body &&
          body.data &&
          typeof body.data === "object"
            ? (body.data as {
                order_id?: unknown;
                new_balance?: unknown;
                token_label?: unknown;
                status?: unknown;
              })
            : null;
        if (rawData && typeof rawData.order_id === "string") {
          const newBalance =
            typeof rawData.new_balance === "number"
              ? rawData.new_balance
              : null;
          clearCart();
          setNotes("");
          setPaymentMethod("wallet");
          setOpen(false);

          window.dispatchEvent(
            new CustomEvent("walletUpdated", {
              detail: newBalance !== null ? { balance: newBalance } : {},
            }),
          );
          window.dispatchEvent(
            new CustomEvent("orderPlaced", {
              detail: {
                order_id: rawData.order_id,
                token_label: rawData.token_label,
              },
            }),
          );
          router.push(`/order/${rawData.order_id}`);
          return;
        }
        toast.error("Order failed — please try again");
        return;
      }

      if (res.status === 402) {
        toast.error("Insufficient balance — please top up");
        return;
      }
      if (res.status === 400) {
        const code =
          body &&
          typeof body === "object" &&
          "code" in body
            ? (body as { code?: string }).code
            : undefined;

        toast.error("One or more items are no longer available");
        return;
      }
      toast.error("Order failed — please try again");
    } catch {
      toast.error("Order failed — please try again");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex h-full max-h-[100dvh] w-full max-w-md flex-col gap-0 p-0 sm:max-w-md"
        showCloseButton={false}
      >
        {/* Header */}
        <SheetHeader className="flex shrink-0 flex-row items-center justify-between border-b border-[#F0E6D8] bg-[#FDFAF7] p-4">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-lg text-[#3D2B1F]">Your Cart</SheetTitle>
            {totalItemCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#3D2B1F] px-1.5 text-[10px] font-bold text-white">
                {totalItemCount}
              </span>
            )}
          </div>
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-full bg-[#FFF4EC] text-[#3D2B1F] transition-colors hover:bg-[#3D2B1F] hover:text-white"
            aria-label="Close cart"
            onClick={() => setOpen(false)}
          >
            <XIcon className="size-3.5" />
          </button>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {isEmpty ? (
              <div className="flex flex-col items-center pb-6">
                <EmptyState
                  icon="🍽️"
                  title="Your cart is empty"
                  description="Add something delicious from the menu."
                />
                <Link
                  href="/menu"
                  onClick={() => setOpen(false)}
                  className="mt-2 inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium text-white transition-colors bg-[#F97316] hover:bg-[#EA6C0A]"
                >
                  Browse Menu
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col gap-4">
                {items.map((item) => {
                  const lineTotal = item.price * item.quantity;
                  return (
                    <li
                      key={item.id}
                      className="flex flex-col gap-2 border-b border-[#F0E6D8] pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-snug text-[#3D2B1F]">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatInr(item.price)} each
                          </p>
                        </div>
                        <button
                          type="button"
                          className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => removeItem(item.id)}
                        >
                          <XIcon className="size-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 rounded-lg border border-[#3D2B1F]/20 bg-[#FFF4EC] p-0.5">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            className="flex size-7 items-center justify-center rounded-md text-[#3D2B1F] transition-colors hover:bg-[#3D2B1F] hover:text-white"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                          >
                            <MinusIcon className="size-3.5" />
                          </button>
                          <span className="min-w-8 text-center text-sm font-bold tabular-nums text-[#3D2B1F]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={item.quantity >= 10}
                            className="flex size-7 items-center justify-center rounded-md text-[#3D2B1F] transition-colors hover:bg-[#3D2B1F] hover:text-white disabled:opacity-40"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            <PlusIcon className="size-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-[#F97316]">
                          {formatInr(lineTotal)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-[#F0E6D8] bg-[#FDFAF7] px-4 py-4">
            <Separator className="mb-4 bg-[#F0E6D8]" />

            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Order subtotal</span>
              <span className="font-semibold tabular-nums text-[#F97316]">
                {formatInr(subtotal)}
              </span>
            </div>

            <label className="mb-3 block text-sm font-medium text-[#3D2B1F]">
              Add a note for the café
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 200))}
                maxLength={200}
                rows={3}
                placeholder="Optional (max 200 characters)"
                className={cn(
                  "mt-1.5 w-full resize-none rounded-lg border border-[#F0E6D8] bg-[#FDF6EE] px-2.5 py-2 text-sm outline-none",
                  "placeholder:text-muted-foreground focus-visible:border-[#3D2B1F] focus-visible:ring-3 focus-visible:ring-[#3D2B1F]/20",
                )}
              />
            </label>
            <p className="mb-3 text-xs text-muted-foreground">
              {notes.length}/200
            </p>

            {/* Payment method toggle */}
            <div className="mb-3 flex overflow-hidden rounded-lg border border-[#F0E6D8]">
              <button
                type="button"
                onClick={() => setPaymentMethod("wallet")}
                className={cn(
                  "flex-1 py-2 text-sm font-medium transition-colors",
                  paymentMethod === "wallet"
                    ? "bg-[#3D2B1F] text-white"
                    : "text-muted-foreground hover:text-[#3D2B1F]",
                )}
              >
                💳 Wallet
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("cod")}
                className={cn(
                  "flex-1 py-2 text-sm font-medium transition-colors",
                  paymentMethod === "cod"
                    ? "bg-[#3D2B1F] text-white"
                    : "text-muted-foreground hover:text-[#3D2B1F]",
                )}
              >
                💵 Pay at Counter
              </button>
            </div>

            {/* Balance row */}
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <WalletIcon className="size-3.5" />
                Balance
              </span>
              <span className="font-medium tabular-nums text-[#3D2B1F]">
                {balance !== null ? formatInr(balance) : "—"}
              </span>
            </div>

            {isEmpty ? (
              <Button
                type="button"
                disabled
                className="w-full bg-[#F97316] text-white opacity-50"
              >
                Add items to order
              </Button>
            ) : paymentMethod === "wallet" && insufficient ? (
              <>
                <Button
                  type="button"
                  disabled
                  className="w-full bg-[#F97316] text-white opacity-60"
                >
                  {formatInr(shortfall)} more needed
                </Button>
                <Link
                  href="/wallet"
                  className="mt-2 inline-block text-sm font-medium text-[#3D2B1F] underline-offset-4 hover:underline"
                  onClick={() => setOpen(false)}
                >
                  Top up wallet →
                </Link>
              </>
            ) : (
              <Button
                type="button"
                disabled={isLoading}
                className="w-full bg-[#F97316] text-white hover:bg-[#EA6C0A]"
                onClick={() => void handlePlaceOrder()}
              >
                {isLoading
                  ? "Placing…"
                  : paymentMethod === "cod"
                    ? `Pay at Counter — ${formatInr(subtotal)}`
                    : `Place Order — ${formatInr(subtotal)}`}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}




