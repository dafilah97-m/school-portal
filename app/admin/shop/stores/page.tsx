import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import NewStoreForm from '@/components/admin/shop/NewStoreForm'
import StoreActiveToggle from '@/components/admin/shop/StoreActiveToggle'
import type { CampaignStore } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function StoresPage() {
  const supabase = await createClient()
  const { data: stores } = await supabase
    .from('campaigns_stores')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Stores</h1>
      <NewStoreForm />

      <div className="border rounded-xl divide-y">
        {(stores as CampaignStore[] | null)?.map((store) => (
          <div key={store.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{store.school_name}</p>
              <p className="text-xs text-gray-500">/store/{store.slug}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/admin/shop/stores/${store.id}/products`}
                className="text-sm text-gray-600 underline"
              >
                Products
              </Link>
              <StoreActiveToggle id={store.id} isActive={store.is_active} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
