import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import PageWrapper from '@/components/shared/PageWrapper'
import { HistorySkeleton, OrderHistory, type OrderWithItems } from './OrderHistory'

const LIMIT = 20

async function HistoryContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { count, error: countError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', user.id)

  if (countError) {
    return <OrderHistory initialOrders={[]} initialTotal={0} />
  }

  const total = count ?? 0

  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    .range(0, LIMIT - 1)

  const orders = (data ?? []) as OrderWithItems[]

  return <OrderHistory initialOrders={orders} initialTotal={total} />
}

export default function OrderHistoryPage() {
  return (
    <PageWrapper variant='slide'>
      <div className="mx-auto max-w-lg px-4 py-6">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-[#3D2B1F]">
          <span className="inline-block w-1 h-6 rounded-full bg-[#F97316]" />
          Order History
        </h1>
        <Suspense fallback={<HistorySkeleton />}>
          <HistoryContent />
        </Suspense>
      </div>
    </PageWrapper>
  )
}
