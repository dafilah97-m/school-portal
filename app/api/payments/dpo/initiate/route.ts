import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'
import { requireUser } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'
import { createToken, hostedPaymentUrl } from '@/lib/dpo'

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireUser()
    const { orderId } = await request.json()
    if (!orderId) throw new ApiError(400, 'orderId is required')

    const supabase = await createClient()
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (!order) throw new ApiError(404, 'Order not found')
    if (order.payment_status === 'paid') throw new ApiError(400, 'Order already paid')

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const result = await createToken({
      orderId: order.id,
      amount: order.total_amount,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      redirectUrl: `${siteUrl}/checkout/success`,
      backUrl: `${siteUrl}/checkout`,
      description: `School Portal order ${order.id}`,
    })

    if (result.result !== '000' || !result.transToken) {
      throw new ApiError(502, result.explanation || 'DPO Pay could not create a payment token')
    }

    // service-role write: customers may only read their own orders via RLS,
    // never update payment fields directly.
    const serviceClient = await createServiceClient()
    await serviceClient
      .from('orders')
      .update({ dpo_trans_token: result.transToken })
      .eq('id', order.id)

    return NextResponse.json({ redirectUrl: hostedPaymentUrl(result.transToken) })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error initiating payment' }, { status: 500 })
  }
}
