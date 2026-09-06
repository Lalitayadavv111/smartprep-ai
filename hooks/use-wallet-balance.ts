"use client";

import { useCallback, useEffect, useState } from "react";

/** Fetches `/api/wallet/balance`; skips when `skip` (e.g. admin routes). Refetches on `walletUpdated`. */
export function useWalletBalance(skip: boolean) {
  const [balance, setBalance] = useState<number | null>(null);

  const load = useCallback(async () => {
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
        setBalance((body.data as { balance: number }).balance);
      } else {
        setBalance(null);
      }
    } catch {
      setBalance(null);
    }
  }, []);

  useEffect(() => {
    if (skip) return;
    void load();
  }, [skip, load]);

  useEffect(() => {
    if (skip) return;
    const onWalletUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{ balance?: number }>).detail;
      if (typeof detail?.balance === "number") {
        setBalance(detail.balance); // use the value from the event, no re-fetch needed
      } else {
        void load(); // fallback if no balance in detail
      }
    };
    window.addEventListener("walletUpdated", onWalletUpdated);
    return () => window.removeEventListener("walletUpdated", onWalletUpdated);
  }, [skip, load]);

  return skip ? null : balance;
}
