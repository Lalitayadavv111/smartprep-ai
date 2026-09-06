'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'

import type { RealtimeChannel } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/client'
import type { Order, OrderItem } from '@/lib/types/database'

export type ActiveOrder = Order & { items: OrderItem[] }

interface ActiveOrderContextValue {
  activeOrder: ActiveOrder | null
  isLoading: boolean
}

const ActiveOrderContext = createContext<ActiveOrderContextValue | null>(null)

type ApiResponse = {
  data: { order: (Order & { order_items: OrderItem[] }) | null }
}

export function ActiveOrderProvider({ children }: { children: ReactNode }) {
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function refetchActive() {
    try {
      const res = await fetch('/api/orders/active', { cache: 'no-store' })
      if (!res.ok) return
      const json = (await res.json()) as ApiResponse
      const order = json.data.order
      if (order) {
        const { order_items, ...rest } = order
        setActiveOrder({ ...rest, items: order_items })
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    let mounted = true
    async function fetchActive() {
      try {
        const res = await fetch('/api/orders/active', { cache: 'no-store' })
        if (!res.ok || !mounted) return
        const json = (await res.json()) as ApiResponse
        const order = json.data.order
        if (order && mounted) {
          const { order_items, ...rest } = order
          setActiveOrder({ ...rest, items: order_items })
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    void fetchActive()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    function handleOrderPlaced() {
      void refetchActive()
    }
    window.addEventListener('orderPlaced', handleOrderPlaced)
    return () => window.removeEventListener('orderPlaced', handleOrderPlaced)
  }, [])

  useEffect(() => {
    let insertChannel: RealtimeChannel | null = null

    async function setup() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      insertChannel = supabase
        .channel('orders-insert-' + Date.now())
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: 'student_id=eq.' + user.id,
          },
          () => { void refetchActive() }
        )
        .subscribe()
    }

    void setup()

    return () => {
      if (insertChannel) void supabase.removeChannel(insertChannel)
    }
  }, [supabase])

  useEffect(() => {
    if (!activeOrder?.id) return
    if (channelRef.current) return

    channelRef.current = supabase
      .channel("banner-" + activeOrder.id)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: "id=eq." + activeOrder.id,
        },
        (payload) => {
          const updated = payload.new as Order
          setActiveOrder((prev) => (prev ? { ...prev, ...updated } : null))

          if (updated.status === "ready") {
            window.dispatchEvent(new CustomEvent("orderReady", { detail: updated }))
          }
          window.dispatchEvent(new CustomEvent("orderStatusChanged", { detail: updated }))

          if (updated.status === "collected") {
            if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
            clearTimerRef.current = setTimeout(() => setActiveOrder(null), 5000)
          }
          if (updated.status === "cancelled") {
            toast.error("Your order has been cancelled. Your wallet has been refunded.")
            fetch("/api/wallet/balance")
                .then((res) => res.json())
                  .then((body: unknown) => {
      const bal = (body as { data?: { balance?: number } })?.data?.balance
      if (typeof bal === "number") {
        window.dispatchEvent(new CustomEvent("walletUpdated", { detail: { balance: bal } }))
      }
    })
    .catch(() => {})
            if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
            clearTimerRef.current = setTimeout(() => setActiveOrder(null), 5000)
          }
        },
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current)
        clearTimerRef.current = null
      }
    }
  }, [activeOrder?.id, supabase])

  return (
    <ActiveOrderContext.Provider value={{ activeOrder, isLoading }}>
      {children}
    </ActiveOrderContext.Provider>
  )
}

export function useActiveOrder(): ActiveOrderContextValue {
  const ctx = useContext(ActiveOrderContext)
  if (!ctx) throw new Error('useActiveOrder must be used within ActiveOrderProvider')
  return ctx
}