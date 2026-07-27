import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase-public'
import type { CampaignStore } from '@/lib/types'

export const revalidate = 60

export default async function ShopPage() {
  const supabase = createPublicClient()
  const { data: stores } = await supabase
    .from('campaigns_stores')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2 text-primary">Shop</h1>
      <p className="text-muted-foreground mb-8">Active school merchandise campaigns.</p>

      {!stores || stores.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active stores right now — check back soon.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(stores as CampaignStore[]).map((store) => (
            <Link
              key={store.id}
              href={`/store/${store.slug}`}
              className="border border-border bg-card rounded-xl p-5 hover:shadow-md hover:border-[#C9A227] transition-all"
            >
              <p className="font-medium text-primary">{store.school_name}</p>
              {store.end_date && (
                <p className="text-xs text-muted-foreground mt-1">
                  Closes {new Date(store.end_date).toLocaleDateString()}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
