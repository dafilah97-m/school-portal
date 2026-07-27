import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Order, OrderItem, PurchasedResource, Test, TestAttempt } from '@/lib/types'

interface OrderWithItems extends Order {
  order_items: OrderItem[]
}

interface PurchaseWithResource extends PurchasedResource {
  edu_resources: { title: string; subject: string; grade_level: string | null; year: number | null } | null
}

interface AttemptWithTest extends TestAttempt {
  tests: { title: string } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: orders }, { data: purchases }, { data: availableTests }, { data: attempts }] = await Promise.all([
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
    supabase
      .from('tests')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false }),
    supabase
      .from('test_attempts')
      .select('*, tests(title)')
      .eq('user_id', user.id)
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: false }),
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
        <h2 className="text-xl font-bold mb-6">Practice Tests</h2>
        {!availableTests || availableTests.length === 0 ? (
          <p className="text-sm text-gray-500">No practice tests published yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {(availableTests as Test[]).map((test) => (
              <div key={test.id} className="border rounded-xl p-4">
                <p className="font-medium">{test.title}</p>
                <p className="text-xs text-gray-500 mb-3">
                  {test.subject}
                  {test.grade_level ? ` · ${test.grade_level}` : ''} · {test.duration_minutes} min
                </p>
                <Link href={`/dashboard/tests/${test.id}/take`}>
                  <Button size="sm">Start test</Button>
                </Link>
              </div>
            ))}
          </div>
        )}

        {attempts && attempts.length > 0 && (
          <>
            <h3 className="text-sm font-semibold text-gray-500 mb-3">My results</h3>
            <div className="border rounded-xl divide-y">
              {(attempts as AttemptWithTest[]).map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between p-3 text-sm">
                  <span>{attempt.tests?.title ?? 'Test'}</span>
                  <span className="font-medium">
                    {attempt.score} / {attempt.total_questions}
                  </span>
                </div>
              ))}
            </div>
          </>
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
