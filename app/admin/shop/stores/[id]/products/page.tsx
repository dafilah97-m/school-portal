import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import ProductForm from '@/components/admin/shop/ProductForm'
import ProductRow from '@/components/admin/shop/ProductRow'
import type { Product } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function StoreProductsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: store } = await supabase.from('campaigns_stores').select('*').eq('id', id).single()
  if (!store) notFound()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <Link href="/admin/shop/stores" className="text-sm text-gray-500 underline">
        ← All stores
      </Link>
      <h1 className="text-xl font-bold mt-2 mb-6">{store.school_name} — Products</h1>

      <ProductForm storeId={id} />

      <div className="border rounded-xl divide-y">
        {!products || products.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No products yet.</p>
        ) : (
          (products as Product[]).map((product) => <ProductRow key={product.id} product={product} />)
        )}
      </div>
    </div>
  )
}
