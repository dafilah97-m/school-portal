import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'
import { loadFulfillmentRows } from '@/lib/fulfillment-list'
import { toCsv } from '@/lib/csv'

export async function GET(request: NextRequest) {
  try {
    await requireRole('shop_admin', 'super_admin')
    const storeId = request.nextUrl.searchParams.get('store_id') || undefined

    const rows = await loadFulfillmentRows(storeId)
    const csv = toCsv(
      rows.map((r) => ({
        Student: r.student,
        'Grade/Class': r.gradeClass,
        Product: r.product,
        Size: r.size,
        Quantity: r.quantity,
        Customization: r.customization,
      })),
      ['Student', 'Grade/Class', 'Product', 'Size', 'Quantity', 'Customization']
    )

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="fulfillment-list.csv"',
      },
    })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error exporting CSV' }, { status: 500 })
  }
}
