"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { staggerContainer, scaleIn } from "@/lib/animations";
import PageWrapper from "@/components/shared/PageWrapper";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WalletTransaction } from "@/lib/types/database";

const PRESET_AMOUNTS = [50, 100, 200, 500] as const;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Student: wallet balance, top-up, and recent wallet activity. */
export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const rzpScriptLoaded = useRef(false);

  const effectiveAmount =
    selectedAmount ?? (customAmount !== "" ? Number(customAmount) : null);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet/balance");
      const body: unknown = await res.json();
      if (
        body &&
        typeof body === "object" &&
        "data" in body &&
        body.data &&
        typeof body.data === "object" &&
        "balance" in body.data &&
        typeof (body.data as { balance: unknown }).balance === "number"
      ) {
        const bal = (body.data as { balance: number }).balance;
        setBalance(bal);
        // window.dispatchEvent(new CustomEvent("walletUpdated", { detail: { balance: bal } }));
      }
    } catch {
      // silently ignore
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const res = await fetch("/api/wallet/transactions");
      const body: unknown = await res.json();
      if (
        body &&
        typeof body === "object" &&
        "data" in body &&
        body.data &&
        typeof body.data === "object" &&
        "transactions" in body.data &&
        Array.isArray(
          (body.data as { transactions: unknown }).transactions,
        )
      ) {
        setTransactions(
          (
            (body.data as { transactions: unknown[] })
              .transactions as WalletTransaction[]
          ).slice(0, 10),
        );
      }
    } catch {
      // silently ignore
    } finally {
      setTxLoading(false);
    }
  }, []);
  useEffect(() => {
    void fetchBalance();
    void fetchTransactions();
  }, [fetchBalance, fetchTransactions]);

  useEffect(() => {
    const onWalletUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{ balance?: number }>).detail;
      if (typeof detail?.balance === 'number') {
        setBalance(detail.balance);
        void fetchTransactions();
      }
    };
    window.addEventListener('walletUpdated', onWalletUpdated);
    return () => window.removeEventListener('walletUpdated', onWalletUpdated);
  }, [fetchTransactions]);;

  function loadRazorpayScript(): Promise<void> {
    return new Promise((resolve) => {
      if (rzpScriptLoaded.current || window.Razorpay) {
        rzpScriptLoaded.current = true;
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        rzpScriptLoaded.current = true;
        resolve();
      };
      document.body.appendChild(script);
    });
  }

  async function handleTopUp() {
    if (!effectiveAmount) return;
    setIsLoading(true);

    try {
      const orderRes = await fetch("/api/wallet/initiate-topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: effectiveAmount }),
      });
      const orderBody: unknown = await orderRes.json();

      if (
        !orderRes.ok ||
        !orderBody ||
        typeof orderBody !== "object" ||
        !("data" in orderBody)
      ) {
        toast.error("Failed to initiate payment. Please try again.");
        setIsLoading(false);
        return;
      }

      const data = (orderBody as { data: Record<string, unknown> }).data;

      await loadRazorpayScript();

      const amountAtCheckout = effectiveAmount;

      const options = {
        key: data.key_id as string,
        amount: data.amount as number,
        currency: data.currency as string,
        name: "NoQ",
        description: "Wallet Top-up",
        order_id: data.razorpay_order_id as string,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/wallet/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyBody: unknown = await verifyRes.json();

            if (
              verifyRes.ok &&
              verifyBody &&
              typeof verifyBody === "object" &&
              "data" in verifyBody
            ) {
              const newBalance = (
                verifyBody as { data: { new_balance?: number } }
              ).data.new_balance;

              if (typeof newBalance === "number") setBalance(newBalance);
              toast.success(
                `Wallet topped up successfully! ₹${amountAtCheckout} added`,
              );
              window.dispatchEvent(
                new CustomEvent("walletUpdated", {
                  detail: { balance: newBalance },
                }),
              );
              void fetchTransactions();
            } else {
              toast.error(
                "Payment verification failed. Contact support if amount was deducted.",
              );
            }
          } catch {
            toast.error(
              "Payment verification failed. Contact support if amount was deducted.",
            );
          } finally {
            setIsLoading(false);
          }
        },
        prefill: { name: "", email: "" },
        theme: { color: "#F97316" },
      };

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded");
      }

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        toast.error("Payment failed — please try again");
        setIsLoading(false);
      });
      rzp.open();
    } catch {
      toast.error("Payment failed — please try again");
      setIsLoading(false);
    }
  }

  return (
    <PageWrapper variant='slide'>
    <div className="mx-auto max-w-lg space-y-6">
      {/* Balance card */}
      <div className="rounded-2xl border border-[#92400E]/15 border-l-[3px] border-l-[#F97316] bg-[#FFFCF8] p-8 text-center shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#6B4F3A]">
          My Wallet
        </p>
        {balance === null ? (
          <div className="flex justify-center">
            <Loader2Icon className="size-9 animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="mx-auto w-fit">
            <p className="text-[48px] font-bold leading-none tracking-tight text-[#F97316]">
              ₹{Math.round(balance)}
            </p>
            <div className="mt-3 h-px w-full bg-[#F5D7BD]" />
          </div>
        )}
      </div>

      {/* Add money */}
      <div className="rounded-2xl border border-[#92400E]/15 bg-[#FFFCF8] p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-[#3D2B1F]">
          + Add Money
        </h2>

        <motion.div
          variants={staggerContainer as Variants}
          initial='hidden'
          animate='visible'
          className="mb-4 grid grid-cols-4 gap-2"
        >
          {PRESET_AMOUNTS.map((amount) => (
            <motion.div key={amount} variants={scaleIn as Variants}>
              <button
                type="button"
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount("");
                }}
                className={cn(
                  "w-full rounded-xl border py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50",
                  selectedAmount === amount && customAmount === ""
                    ? "border-[#3D2B1F] bg-[#3D2B1F] text-white shadow-md scale-[1.03]"
                    : "border-[#92400E]/20 bg-[#FDF6EE] text-[#3D2B1F] hover:border-[#92400E] hover:bg-[#F5E6D3]",
                )}
              >
                ₹{amount}
              </button>
            </motion.div>
          ))}
        </motion.div>

        <input
          type="number"
          min={50}
          max={2000}
          placeholder="₹ Custom amount"
          value={customAmount}
          onChange={(e) => {
            setCustomAmount(e.target.value);
            setSelectedAmount(null);
          }}
          className="w-full rounded-lg border border-[#92400E]/20 bg-[#FDF6EE] px-3 py-2.5 text-sm text-[#3D2B1F] placeholder:text-[#9CA3AF] focus:border-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]/20"
        />

        {effectiveAmount ? (
          <p className="mt-3 text-center text-sm text-muted-foreground">
            You will add:{" "}
            <span className="font-semibold text-foreground">
              ₹{effectiveAmount}
            </span>
          </p>
        ) : null}

        <Button
          type="button"
          disabled={!effectiveAmount || isLoading}
          onClick={() => void handleTopUp()}
          className={cn(
            "mt-4 h-11 w-full rounded-xl text-base font-semibold transition-all duration-200",
            effectiveAmount
              ? "bg-[#F97316] text-white hover:bg-[#EA6C0A]"
              : "bg-[#EEDFD0] text-[#8A6A54] hover:bg-[#EEDFD0]",
            "disabled:cursor-not-allowed",
          )}
        >
          {isLoading ? (
            <>
              <Loader2Icon className="mr-2 size-4 animate-spin" />
              Processing...
            </>
          ) : effectiveAmount ? (
            `Pay ₹${effectiveAmount} via Razorpay`
          ) : (
            "Select an amount"
          )}
        </Button>
      </div>

      {/* Transaction history */}
      <div className="rounded-2xl border border-[#92400E]/15 bg-[#FFFCF8] p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-[#3D2B1F]">
          Recent Transactions
        </h2>

        {txLoading ? (
          <div className="flex justify-center py-8">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No transactions yet
          </p>
        ) : (
          <ul className="divide-y divide-[#EBD7C3]">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 py-3">
                <span
                  aria-hidden
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-base font-bold",
                    tx.type === "topup" || tx.type === "refund"
                      ? "bg-[#EAF8EC] text-[#2F9E44]"
                      : "bg-[#F0E5D6] text-[#7A4A1E]",
                  )}
                >
                  {tx.type === "topup" || tx.type === "refund" ? "↑" : "↓"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-[500] text-foreground">
                    {tx.description ??
                      (tx.type === "topup"
                        ? "Wallet top-up"
                        : tx.type === "refund"
                          ? "Refund"
                          : "Order payment")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(tx.created_at)}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-sm font-semibold tabular-nums",
                    tx.type === "topup" || tx.type === "refund"
                      ? "text-[#2F9E44]"
                      : "text-[#3D2B1F]",
                  )}
                >
                  {tx.type === "topup" || tx.type === "refund" ? "+" : "−"}
                  ₹{Math.round(tx.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
    </PageWrapper>
  );
}