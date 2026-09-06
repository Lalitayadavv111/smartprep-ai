'use client'

import { useState, useEffect } from 'react'
import { motion, type Variants } from 'framer-motion'
import { staggerContainer, fadeUp } from '@/lib/animations'

import { createClient } from '@/lib/supabase/client'
import type { Order, OrderItem } from '@/lib/types/database'
import { EmptyState } from '@/components/common/EmptyState'
import StatusBadge from '@/components/common/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

export type OrderWithItems = Order & { order_items: OrderItem[] }

type HistoryApiResponse = {
  data: {
    orders: OrderWithItems[]
    total: number
    page: number
    limit: number
    hasMore: boolean
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function HistorySkeleton() {
  return (
    <div className="space-y-3">
      <div className="mb-2 space-y-2">
        <Skeleton className="h-7 w-36 bg-[#E8D5C4]" />
        <Skeleton className="h-4 w-44 bg-[#EAD9CC]" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="space-y-3 rounded-xl border border-[#92400E]/15 bg-white p-4"
        >
          <div className="flex items-center justify-between">
            <div className="relative h-5 w-20 overflow-hidden rounded bg-[#F0E5D6]">
              <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70" style={{ animation: 'shimmer 1.5s linear infinite' }} />
            </div>
            <div className="relative h-5 w-16 overflow-hidden rounded-full bg-[#F0E5D6]">
              <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70" style={{ animation: 'shimmer 1.5s linear infinite' }} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="relative h-4 w-32 overflow-hidden rounded bg-[#F0E5D6]">
              <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70" style={{ animation: 'shimmer 1.5s linear infinite' }} />
            </div>
            <div className="relative h-4 w-16 overflow-hidden rounded bg-[#F0E5D6]">
              <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70" style={{ animation: 'shimmer 1.5s linear infinite' }} />
            </div>
          </div>
          <div className="mt-3 border-t border-[#92400E]/10 pt-2">
            <div className="flex items-center justify-end gap-1.5">
              <div className="h-1 w-1 rounded-full bg-[#E4D0B7]" />
              <div className="relative h-3 w-24 overflow-hidden rounded bg-[#F0E5D6]">
                <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70" style={{ animation: 'shimmer 1.5s linear infinite' }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function OrderCard({ order }: { order: OrderWithItems }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="group relative rounded-xl border border-[#92400E]/15 bg-white/80 overflow-hidden transition-shadow hover:shadow-md">
      <button
        className="w-full cursor-pointer p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-bold text-[#3D2B1F]">{order.token_label}</span>
          <StatusBadge status={order.status} />
        </div>
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="text-xs text-[#6B4F3A]">{formatDate(order.created_at)}</span>
          <span className="font-medium text-foreground">
            ₹{Math.round(order.total_amount)}
          </span>
        </div>
        {order.status.toLowerCase() !== 'cancelled' ? (
          <div className="mt-3 border-t border-[#92400E]/10 pt-2">
            <div className="flex items-center justify-end gap-1.5 text-xs text-[#6B4F3A]">
              <span className="h-1 w-1 rounded-full bg-[#6B4F3A]" />
              <span>{expanded ? 'tap to minimize' : 'tap to see details'}</span>
            </div>
          </div>
        ) : null}
      </button>

      {expanded && (
        <div className="border-t border-[#92400E]/10 bg-[#FDF6EE]/50 px-4 pb-4 pt-3 space-y-1.5">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-[#6B4F3A]">
                {item.item_name} × {item.quantity}
              </span>
              <span className="font-medium text-foreground">
                ₹{Math.round(item.item_price * item.quantity)}
              </span>
            </div>
          ))}
          {order.notes ? (
            <p className="mt-2 border-t pt-2 text-xs italic text-muted-foreground">
              Note: {order.notes}
            </p>
          ) : null}
        </div>
      )}
      <div className="pointer-events-none absolute bottom-0 left-0 h-[3px] w-full origin-left scale-x-0 bg-[#92400E] transition-transform duration-300 group-hover:scale-x-100" />
    </div>
  )
}

type Props = {
  initialOrders: OrderWithItems[]
  initialTotal: number
}

export function OrderHistory({ initialOrders, initialTotal }: Props) {
  const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialOrders.length < initialTotal)

  useEffect(() => {
    const supabase = createClient()
    let insertChannel: ReturnType<typeof supabase.channel> | null = null
    let mounted = true  // ← ADD THIS
  
    async function fetchFirstPage() {
      const res = await fetch('/api/orders/history?page=1&limit=20')
      if (!res.ok) return
      const json = (await res.json()) as HistoryApiResponse
      setOrders(json.data.orders)
      setHasMore(json.data.hasMore)
    }
  
    async function setup() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) return  // ← ADD !mounted check
  
      insertChannel = supabase
        .channel('history-insert-' + Date.now())
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: 'student_id=eq.' + user.id,
          },
          () => { void fetchFirstPage() },
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: 'student_id=eq.' + user.id,
          },
          (payload) => {
            const updated = payload.new as Order
            void (async () => {
              const { data } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .eq('id', updated.id)
                .single()
              if (data) {
                setOrders((prev) =>
                  prev.map((o) =>
                    o.id === updated.id ? (data as OrderWithItems) : o,
                  ),
                )
              }
            })()
          },
        )
        .subscribe()
    }
  
    void setup()
  
    return () => {
      mounted = false  // ← ADD THIS
      if (insertChannel) void supabase.removeChannel(insertChannel)
    }
  }, [])

  async function loadMore() {
    setIsLoading(true)
    try {
      const nextPage = page + 1
      const res = await fetch(`/api/orders/history?page=${nextPage}&limit=20`)
      if (!res.ok) return
      const json = (await res.json()) as HistoryApiResponse
      setOrders((prev) => [...prev, ...json.data.orders])
      setPage(nextPage)
      setHasMore(json.data.hasMore)
    } finally {
      setIsLoading(false)
    }
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon="■"
        title="Place your first order"
        description="Looks like you haven't ordered anything yet. Browse the menu and get started!"
        action={{ label: 'Browse menu', href: '/menu' }}
      />
    )
  }

  return (
    <motion.div
      variants={staggerContainer as Variants}
      initial='hidden'
      animate='visible'
      className="space-y-3"
    >
      {orders.map((order) => (
        <motion.div key={order.id} variants={fadeUp as Variants}>
          <OrderCard order={order} />
        </motion.div>
      ))}
      {hasMore ? (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => void loadMore()}
          disabled={isLoading}
        >
          {isLoading ? 'Loading…' : 'Load more'}
        </Button>
      ) : null}
    </motion.div>
  )
}