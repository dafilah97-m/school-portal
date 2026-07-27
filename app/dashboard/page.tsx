import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Order, OrderItem, PurchasedResource } from '@/lib/types'

interface OrderWithItems extends Order {
  order_items: OrderItem[]
}

interface PurchaseWithResource extends PurchasedResource {
  edu_resources: { title: string; subject: string; grade_level: string | null; year: number | null } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: orders }, { data: purchases }] = await Promise.all([
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('purchased_resources')
      .select('*, edu_resources(title, subject, grade_level, year)')
      .eq('user_id', user.id)
      .order('purchase_date', { ascending: false }),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">
      <section>
        <h1 className="text-2xl font-bold mb-6 text-primary">My Exams</h1>
        {!purchases || purchases.length === 0 ? (
          <p className="text-sm text-gray-500">
            No purchased resources yet.{' '}
            <Link href="/exams" className="underline">
              Browse Exams
            </Link>
            .
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {(purchases as PurchaseWithResource[]).map((purchase) => (
              <div key={purchase.id} className="border rounded-xl p-4">
                <p className="font-medium">{purchase.edu_resources?.title}</p>
                <p className="text-xs text-gray-500 mb-3">
                  {purchase.edu_resources?.subject}
                  {purchase.edu_resources?.grade_level ? ` · ${purchase.edu_resources.grade_level}` : ''}
                </p>
                <a href={`/api/edu-vault/download/${purchase.resource_id}`}>
                  <Button size="sm">Download PDF</Button>
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-6">My Orders</h2>
        {!orders || orders.length === 0 ? (
          <p className="text-sm text-gray-500">No orders yet.</p>
        ) : (
          <div className="space-y-4">
            {(orders as OrderWithItems[]).map((order) => (
              <div key={order.id} className="border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()} · {order.grade_class}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                      {order.payment_status}
                    </Badge>
                    <Badge variant="outline">{order.fulfillment_status}</Badge>
                  </div>
                </div>
                <p className="text-sm">{order.order_items?.length ?? 0} item(s) · P{Number(order.total_amount).toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
