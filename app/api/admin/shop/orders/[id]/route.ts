import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'
import { requireRole } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'

export async function PATCH(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole('shop_admin', 'super_admin')
    const { id } = await segmentData.params
    const { fulfillment_status, payment_status } = await request.json()

    const updates: Record<string, string> = {}
    if (fulfillment_status) updates.fulfillment_status = fulfillment_status
    if (payment_status) updates.payment_status = payment_status
    if (Object.keys(updates).length === 0) throw new ApiError(400, 'Nothing to update')

    const supabase = await createClient()
    const { data: order, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error || !order) throw new ApiError(404, 'Order not found')

    // A manual paid override (e.g. DPO webhook missed) must still unlock any
    // digital resources in the order — purchased_resources may only be
    // written by the service-role client, never by the customer.
    if (payment_status === 'paid') {
      const serviceClient = await createServiceClient()
      const { data: items } = await serviceClient
        .from('order_items')
        .select('resource_id')
        .eq('order_id', order.id)
        .not('resource_id', 'is', null)

      const resourceIds = (items ?? []).map((i) => i.resource_id).filter(Boolean) as string[]
      if (resourceIds.length > 0) {
        await serviceClient.from('purchased_resources').upsert(
          resourceIds.map((resourceId) => ({
            user_id: order.user_id,
            resource_id: resourceId,
            order_id: order.id,
          })),
          { onConflict: 'user_id,resource_id', ignoreDuplicates: true }
        )
      }
    }

    return NextResponse.json({ order })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error updating order' }, { status: 500 })
  }
}
