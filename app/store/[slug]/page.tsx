import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase-public'
import StoreHeader from '@/components/storefront/StoreHeader'
import ProductCard from '@/components/storefront/ProductCard'
import type { CampaignStore, Product } from '@/lib/types'

export const revalidate = 60

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createPublicClient()

  const { data: store } = await supabase
    .from('campaigns_stores')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!store) notFound()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <StoreHeader store={store as CampaignStore} />

      {!products || products.length === 0 ? (
        <p className="text-center text-sm text-gray-500">No items in this store yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(products as Product[]).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
