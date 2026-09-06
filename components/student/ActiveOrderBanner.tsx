'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import { bannerSlide } from '@/lib/animations'

import { useActiveOrder } from '@/app/(student)/ActiveOrderContext'
import type { OrderStatus } from '@/lib/types/database'

const STATUS_LABELS: Record<OrderStatus, string> = {
  scheduled: 'Scheduled',
  placed: 'Order Placed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  collected: 'Collected',
  cancelled: 'Cancelled',
}
function getBannerStyles(status: OrderStatus): string {
  if (status === 'ready') return 'bg-[#F97316] ring-2 ring-[#F97316]/40 overflow-hidden relative'
  if (status === 'preparing') return 'bg-[#92400E]'
  if (status === 'placed') return 'bg-[#3D2B1F]'
  if (status === 'collected') return 'bg-[#6B4F3A]'
  if (status === 'cancelled') return 'bg-[#6B4F3A]'
  if (status === 'scheduled') return 'bg-[#3D2B1F]'
  return 'bg-[#3D2B1F]'
}

export function ActiveOrderBanner() {
  const { activeOrder } = useActiveOrder()
  const router = useRouter()
  const [fadingOut, setFadingOut] = useState(false)

  useEffect(() => {
    if (activeOrder?.status !== 'collected') return
    const timer = setTimeout(() => setFadingOut(true), 3000)
    return () => clearTimeout(timer)
  }, [activeOrder?.status])

  if (!activeOrder) return null

  const { status, token_label, id } = activeOrder

  function handleNavigate() {
    router.push(`/order/${id}`)
  }

  return (
    <motion.div
      variants={bannerSlide as Variants}
      initial='hidden'
      animate='visible'
      className={[
        'fixed bottom-0 left-0 right-0 z-50 cursor-pointer text-white shadow-lg',
        getBannerStyles(status),
        fadingOut ? 'opacity-0 transition-opacity duration-1000' : 'opacity-100',
      ].join(' ')}
      role="button"
      tabIndex={0}
      onClick={handleNavigate}
      onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 relative">
        {status === 'ready' && (
          <div
            className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2.5s_ease-in-out_infinite]"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
            }}
          />
        )}
        {status === 'ready' ? (
          <span className="text-sm font-semibold">
            🔔 {token_label} is ready for pickup!
          </span>
        ) : status === 'scheduled' ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Scheduled Order</span>
            <span className="text-white/60">·</span>
            <span className="text-sm">Awaiting slot activation</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {status === 'placed' && '🕐'}
              {status === 'preparing' && '👨‍🍳'}
              {status === 'collected' && '✓'}
              {status === 'cancelled' && '✕'}
            </span>
            <span className="text-sm font-semibold">{token_label}</span>
            <span className="text-white/60">·</span>
            <span className="text-sm">{STATUS_LABELS[status]}</span>
          </div>
        )}
        {status !== 'collected' && (
          <span className="text-xs text-white/80">Tap to track →</span>
        )}
      </div>
    </motion.div>
  )
}
