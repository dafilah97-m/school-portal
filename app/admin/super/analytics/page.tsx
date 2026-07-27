'use client'

import { useEffect, useState } from 'react'
import RevenueCard from '@/components/admin/analytics/RevenueCard'
import RevenueChart from '@/components/admin/analytics/RevenueChart'

interface AnalyticsData {
  byDay: { day: string; merch_revenue: number | null; edu_vault_revenue: number | null }[]
  totals: { totalRevenue: number; merchRevenue: number; eduVaultRevenue: number; fundraisingProfit: number }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    fetch('/api/admin/super/analytics')
      .then((res) => res.json())
      .then(setData)
  }, [])

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Financial analytics</h1>

      {!data ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <RevenueCard label="Total revenue" value={data.totals.totalRevenue} />
            <RevenueCard label="Merchandise revenue" value={data.totals.merchRevenue} />
            <RevenueCard label="Edu-Vault earnings" value={data.totals.eduVaultRevenue} />
            <RevenueCard label="Fundraising profit" value={data.totals.fundraisingProfit} />
          </div>

          <RevenueChart data={data.byDay} />
        </div>
      )}
    </div>
  )
}
