import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { requireRole } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'

interface RevenueByDayRow {
  day: string
  merch_revenue: number | null
  edu_vault_revenue: number | null
  fundraising_profit: number | null
}

export async function GET() {
  try {
    await requireRole('super_admin')

    // v_revenue_by_day is not granted to anon/authenticated — only reachable
    // via the service-role client, after the requireRole check above.
    const supabase = await createServiceClient()
    const { data: byDay } = await supabase
      .from('v_revenue_by_day')
      .select('*')
      .order('day', { ascending: true })

    const totals = ((byDay ?? []) as RevenueByDayRow[]).reduce(
      (acc, row) => {
        acc.merchRevenue += Number(row.merch_revenue || 0)
        acc.eduVaultRevenue += Number(row.edu_vault_revenue || 0)
        acc.fundraisingProfit += Number(row.fundraising_profit || 0)
        return acc
      },
      { merchRevenue: 0, eduVaultRevenue: 0, fundraisingProfit: 0 }
    )

    return NextResponse.json({
      byDay: byDay ?? [],
      totals: {
        ...totals,
        totalRevenue: totals.merchRevenue + totals.eduVaultRevenue,
      },
    })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error loading analytics' }, { status: 500 })
  }
}
