'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { MessageCircleQuestion, X } from 'lucide-react'

import { useActiveOrder } from '@/app/(student)/ActiveOrderContext'
import type { OrderStatus } from '@/lib/types/database'

type QuestionKey =
  | 'no_order_where'
  | 'no_order_what_happens'
  | 'status_current'
  | 'status_meaning'
  | 'status_token'
  | 'status_next'

// Minimal shape needed for answer derivation — satisfied by both ActiveOrder and raw API order rows
type OrderForHelp = {
  id: string
  status: OrderStatus
  token_label: string | null
  scheduled_for: string | null
  created_at: string
  total_amount: number
}

function formatSlotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function labelOrder(order: OrderForHelp, isActive: boolean): string {
  if (isActive) {
    if (order.token_label) return `Active — ${order.token_label}`
    if (order.scheduled_for) return `Active — Scheduled ${formatSlotTime(order.scheduled_for)}`
    return `Active — ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`
  }
  const d = new Date(order.created_at)
  const date = d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (order.status === 'cancelled') return `Cancelled — ${date}, ${time}`
  if (order.status === 'collected')
    return order.token_label ? `Collected — ${order.token_label}` : `Collected — ${date}`
  if (order.status === 'scheduled')
    return order.scheduled_for
      ? `Scheduled — ${formatSlotTime(order.scheduled_for)}`
      : `Scheduled — ${date}`
  return `${order.status.charAt(0).toUpperCase() + order.status.slice(1)} — ${date}, ${time}`
}

function deriveAnswer(q: QuestionKey, order: OrderForHelp | null): string {
  if (!order) {
    if (q === 'no_order_where') return 'Head to the Menu page to browse items and place an order.'
    if (q === 'no_order_what_happens') return 'Once you place an order you will receive a token number and can track its status in real time.'
    return ''
  }

  const status: OrderStatus = order.status
  const token = order.token_label

  if (q === 'status_current') {
    if (status === 'scheduled') {
      const time = order.scheduled_for ? ` for ${formatSlotTime(order.scheduled_for)}` : ''
      return `Your order is scheduled${time} and is waiting for the café to activate that slot.`
    }
    if (status === 'placed') return 'Your order has been placed and is waiting in the live queue.'
    if (status === 'preparing') return 'Your order is currently being prepared.'
    if (status === 'ready') return 'Your order is ready for pickup.'
    if (status === 'collected') return 'This order has already been collected.'
    if (status === 'cancelled') return 'Sorry, this order has been cancelled. If applicable, your wallet refund has already been processed.'
  }

  if (q === 'status_meaning') {
    if (status === 'scheduled') return 'Scheduled means your order is booked for a future pickup slot and will move into preparation when the café activates that slot.'
    if (status === 'placed') return 'Placed means the café has received your order and it is waiting to be prepared.'
    if (status === 'preparing') return 'Preparing means the café has started working on your order.'
    if (status === 'ready') return 'Ready means you can collect your order now.'
    if (status === 'collected') return 'Your order has been collected successfully.'
    if (status === 'cancelled') return 'Cancelled means the order will not be prepared or collected.'
  }

  if (q === 'status_token') {
    if (status === 'scheduled') return 'Your token will be assigned when the café starts preparing your slot batch.'
    if (status === 'placed') return token ? `Your token is ${token}.` : 'Your token will appear shortly once the café begins processing.'
    if (status === 'preparing') return token ? `Your token is ${token}.` : 'Your token should appear very soon.'
    if (status === 'ready') return token ? `Please show token ${token} at pickup.` : 'Please head to the counter now.'
    if (status === 'collected') return 'This order will not receive a new token.'
    if (status === 'cancelled') return 'This order will not receive a token.'
  }

  if (q === 'status_next') {
    if (status === 'scheduled') return 'Please arrive around your selected slot time and keep an eye on your order updates.'
    if (status === 'placed') return 'Please wait for the café to start preparing your order.'
    if (status === 'preparing') return 'Please wait for the order to become ready for pickup.'
    if (status === 'ready') return 'Please go to the café counter and collect your order now.'
    if (status === 'collected') return 'You can place a new order from the menu.'
    if (status === 'cancelled') return 'You can place a new order whenever you are ready.'
  }

  return ''
}

export function OrderHelpWidget() {
  const { activeOrder, isLoading } = useActiveOrder()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<QuestionKey | null>(null)
  const [recentOrders, setRecentOrders] = useState<OrderForHelp[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!open || fetchedRef.current) return
    fetchedRef.current = true
    setOrdersLoading(true)
    fetch('/api/orders?page=1&limit=10', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((json: unknown) => {
        const orders = (json as { data?: { orders?: OrderForHelp[] } })?.data?.orders
        if (Array.isArray(orders)) setRecentOrders(orders)
      })
      .catch(() => setFetchError(true))
      .finally(() => setOrdersLoading(false))
  }, [open])

  // Exclude active order from recent list — it's already shown as "Active" option
  const dedupedRecent = recentOrders.filter(o => o.id !== activeOrder?.id)

  const allOptions: { id: string; label: string }[] = [
    ...(activeOrder ? [{ id: activeOrder.id, label: labelOrder(activeOrder, true) }] : []),
    ...dedupedRecent.map(o => ({ id: o.id, label: labelOrder(o, false) })),
  ]

  // Default to active order, then first recent; explicit user picks stored in selectedOrderId
  const effectiveId = selectedOrderId ?? activeOrder?.id ?? dedupedRecent[0]?.id ?? null
  const isActiveSelected = !!activeOrder && effectiveId === activeOrder.id
  // If the active order disappears, fall through to recentOrders so nothing crashes
  const resolvedOrder: OrderForHelp | null = isActiveSelected
    ? activeOrder
    : recentOrders.find(o => o.id === effectiveId) ?? null

  // Derived inline on every render — never stale; live for active order, static for historical
  const answer = selected ? deriveAnswer(selected, resolvedOrder) : null

  const noOrderButtons: { key: QuestionKey; label: string }[] = [
    { key: 'no_order_where', label: 'Where can I place an order?' },
    { key: 'no_order_what_happens', label: 'What happens after I place an order?' },
  ]

  const activeOrderButtons: { key: QuestionKey; label: string }[] = [
    { key: 'status_current', label: 'What is my current order status?' },
    { key: 'status_meaning', label: 'What does this status mean?' },
    { key: 'status_token', label: 'When will I get my token?' },
    { key: 'status_next', label: 'What should I do next?' },
  ]

  const buttons = resolvedOrder ? activeOrderButtons : noOrderButtons

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#3D2B1F] text-white shadow-lg transition hover:bg-[#5a3e2b] md:bottom-6 md:right-6"
        aria-label="Order help"
      >
        <MessageCircleQuestion className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed bottom-36 right-4 z-50 w-[min(340px,calc(100vw-2rem))] rounded-2xl border bg-card text-card-foreground shadow-xl md:bottom-22 md:right-6">
          <div className="flex items-start justify-between px-4 pt-4 pb-2">
            <div>
              <p className="text-sm font-semibold">Order Help</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                I can help with your order status, token timing, scheduled orders, and what to do next.
              </p>
            </div>
            <button
              onClick={() => { setOpen(false); setSelected(null) }}
              className="ml-2 mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Close help"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4 pb-4">
            {isLoading || ordersLoading ? (
              <div className="mb-3 h-7 w-full animate-pulse rounded-md bg-muted" />
            ) : allOptions.length > 1 ? (
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Order</label>
                <select
                  value={effectiveId ?? ''}
                  onChange={e => { setSelectedOrderId(e.target.value || null); setSelected(null) }}
                  className="w-full rounded-lg border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {allOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ) : allOptions.length === 1 ? (
              <p className="mb-3 text-xs text-muted-foreground">{allOptions[0].label}</p>
            ) : fetchError ? (
              <p className="mb-3 text-xs text-muted-foreground">Could not load recent orders.</p>
            ) : (
              <p className="mb-3 text-xs text-muted-foreground">You do not have any recent orders yet.</p>
            )}

            <p className="mb-2 text-xs text-muted-foreground">
              Choose a question below for a quick answer.
            </p>

            <div className="flex flex-col gap-1.5">
              {buttons.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                    selected === key
                      ? 'border-primary bg-primary/10 font-medium text-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {answer && (
              <div className="mt-3 rounded-lg bg-muted px-3 py-2.5 text-xs leading-relaxed text-foreground">
                {answer}
              </div>
            )}

            {resolvedOrder && (
              <Link
                href={`/order/${resolvedOrder.id}`}
                className="mt-3 flex w-full items-center justify-center rounded-lg border border-primary px-3 py-2 text-xs font-medium text-primary transition hover:bg-primary/10"
              >
                {isActiveSelected ? 'Track order' : 'View order'}
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}
