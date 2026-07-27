import { createClient } from '@/lib/supabase-server'
import OrderRow from '@/components/admin/shop/OrderRow'
import type { Order } from '@/lib/types'

interface OrderWithItemCount extends Order {
  order_items: { id: string }[]
}

export const dynamic = 'force-dynamic'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ grade_class?: string; fulfillment_status?: string }>
}) {
  const { grade_class, fulfillment_status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select('*, order_items(id)')
    .order('created_at', { ascending: false })

  if (grade_class) query = query.ilike('grade_class', `%${grade_class}%`)
  if (fulfillment_status) query = query.eq('fulfillment_status', fulfillment_status)

  const { data: orders } = await query

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Orders</h1>

      <form className="flex flex-wrap gap-3 mb-6" method="get">
        <input
          name="grade_class"
          defaultValue={grade_class}
          placeholder="Filter by grade/class"
          className="border rounded-lg px-3 py-1.5 text-sm"
        />
        <select
          name="fulfillment_status"
          defaultValue={fulfillment_status || ''}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">All fulfillment statuses</option>
          <option value="unfulfilled">Unfulfilled</option>
          <option value="processing">Processing</option>
          <option value="delivered">Delivered</option>
        </select>
        <button type="submit" className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors">
          Filter
        </button>
      </form>

      <div className="border rounded-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="p-3">Customer</th>
              <th className="p-3">Grade/Class</th>
              <th className="p-3">Items</th>
              <th className="p-3">Total</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Fulfillment</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {((orders ?? []) as OrderWithItemCount[]).map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </tbody>
        </table>
        {(!orders || orders.length === 0) && (
          <p className="p-4 text-sm text-gray-500">No orders match those filters.</p>
        )}
      </div>
    </div>
  )
}
