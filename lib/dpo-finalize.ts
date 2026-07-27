import { createServiceClient } from '@/lib/supabase-server'
import { verifyToken } from '@/lib/dpo'

// Shared by the customer-facing success page and DPO's server-to-server
// notification (if configured) — idempotent, keyed on payment_status so
// re-invocation from either path is safe.
export async function finalizeDpoPayment(transToken: string) {
  const result = await verifyToken(transToken)
  if (!result.approved) return { success: false as const, order: null, result }

  const supabase = await createServiceClient()
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('dpo_trans_token', transToken)
    .single()

  if (!order) return { success: false as const, order: null, result }

  if (order.payment_status !== 'paid') {
    await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', order.id)

    const { data: items } = await supabase
      .from('order_items')
      .select('resource_id')
      .eq('order_id', order.id)
      .not('resource_id', 'is', null)

    const resourceIds = (items ?? []).map((i) => i.resource_id).filter(Boolean) as string[]

    if (resourceIds.length > 0) {
      await supabase.from('purchased_resources').upsert(
        resourceIds.map((resourceId) => ({
          user_id: order.user_id,
          resource_id: resourceId,
          order_id: order.id,
        })),
        { onConflict: 'user_id,resource_id', ignoreDuplicates: true }
      )
    }
  }

  return { success: true as const, order, result }
}
