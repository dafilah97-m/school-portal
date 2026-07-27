import { createClient } from '@/lib/supabase-server'
import type { CampaignStore } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function FulfillmentPage({
  searchParams,
}: {
  searchParams: Promise<{ store_id?: string }>
}) {
  const { store_id } = await searchParams
  const supabase = await createClient()
  const { data: stores } = await supabase
    .from('campaigns_stores')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-xl font-bold mb-2">Fulfillment export</h1>
      <p className="text-sm text-gray-500 mb-6">
        Download a print list of paid orders, grouped by grade &amp; class, for factory production.
      </p>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Store</label>
          <select
            name="store_id"
            defaultValue={store_id || ''}
            className="border rounded-lg px-3 py-1.5 text-sm min-w-52"
          >
            <option value="">All stores</option>
            {(stores as CampaignStore[] | null)?.map((store) => (
              <option key={store.id} value={store.id}>
                {store.school_name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="px-4 py-1.5 rounded-lg border text-sm">
          Apply
        </button>
      </form>

      <div className="flex gap-3 mt-4">
        <a
          href={`/api/admin/shop/export/csv${store_id ? `?store_id=${store_id}` : ''}`}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
        >
          Download CSV
        </a>
        <a
          href={`/api/admin/shop/export/pdf${store_id ? `?store_id=${store_id}` : ''}`}
          className="px-4 py-2 rounded-lg border text-sm"
        >
          Download PDF
        </a>
      </div>
    </div>
  )
}
