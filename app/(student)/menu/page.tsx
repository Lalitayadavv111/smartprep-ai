import { createClient } from '@/lib/supabase/server'
import type { Category, MenuItem } from '@/lib/types/database'
import PageWrapper from '@/components/shared/PageWrapper'
import { MenuPage } from './menu-page'

async function fetchMenu(): Promise<{
  categories: Category[]
  items: MenuItem[]
}> {
  const supabase = await createClient()

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, sort_order')
      .order('sort_order', { ascending: true }),
    supabase
      .from('menu_items')
      .select('id, name, description, price, category_id, image_url, is_available')
      .order('name', { ascending: true }),
  ])

  return {
    categories: categories ?? [],
    items: items ?? [],
  }
}

export default async function StudentMenuPage() {
  const { categories, items } = await fetchMenu()
  return (
    <PageWrapper variant='slide'>
      <MenuPage categories={categories} items={items} />
    </PageWrapper>
  )
}