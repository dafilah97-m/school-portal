import type { CampaignStore } from '@/lib/types'

export default function StoreHeader({ store }: { store: CampaignStore }) {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-2xl font-bold">{store.school_name}</h1>
      {store.end_date && (
        <p className="text-sm text-gray-500 mt-1">
          Orders close {new Date(store.end_date).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
