import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { requireUser } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'
import { checkoutSchema } from '@/lib/validations/checkout'

interface CartItemPayload {
  type: 'product' | 'resource'
  id: string
  quantity: number
  selectedSize?: string | null
  customText?: string | null
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireUser()
    const body = await request.json()

    const checkout = checkoutSchema.parse({
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      grade_class: body.grade_class,
    })

    const items: CartItemPayload[] = Array.isArray(body.items) ? body.items : []
    if (items.length === 0) throw new ApiError(400, 'Cart is empty')

    const supabase = await createClient()

    const productIds = items.filter((i) => i.type === 'product').map((i) => i.id)
    const resourceIds = items.filter((i) => i.type === 'resource').map((i) => i.id)

    const [{ data: products }, { data: resources }] = await Promise.all([
      productIds.length
        ? supabase.from('products').select('id, price, title').in('id', productIds)
        : Promise.resolve({ data: [] as { id: string; price: number; title: string }[] }),
      resourceIds.length
        ? supabase
            .from('edu_resources')
            .select('id, price, title')
            .in('id', resourceIds)
            .eq('status', 'published')
        : Promise.resolve({ data: [] as { id: string; price: number; title: string }[] }),
    ])

    const productMap = new Map((products ?? []).map((p) => [p.id, p]))
    const resourceMap = new Map((resources ?? []).map((r) => [r.id, r]))

    let totalAmount = 0
    const orderItemsPayload: {
      product_id: string | null
      resource_id: string | null
      quantity: number
      selected_size: string | null
      custom_text: string | null
      price_at_purchase: number
    }[] = []

    for (const item of items) {
      if (item.type === 'product') {
        const product = productMap.get(item.id)
        if (!product) throw new ApiError(400, `Product ${item.id} not found`)
        const qty = Math.max(1, item.quantity)
        totalAmount += product.price * qty
        orderItemsPayload.push({
          product_id: item.id,
          resource_id: null,
          quantity: qty,
          selected_size: item.selectedSize ?? null,
          custom_text: item.customText ?? null,
          price_at_purchase: product.price,
        })
      } else {
        const resource = resourceMap.get(item.id)
        if (!resource) throw new ApiError(400, `Resource ${item.id} not found or not published`)
        totalAmount += resource.price
        orderItemsPayload.push({
          product_id: null,
          resource_id: item.id,
          quantity: 1,
          selected_size: null,
          custom_text: null,
          price_at_purchase: resource.price,
        })
      }
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        customer_name: checkout.customer_name,
        customer_email: checkout.customer_email,
        grade_class: checkout.grade_class,
        total_amount: totalAmount,
        payment_status: 'pending',
      })
      .select()
      .single()

    if (orderError || !order) throw new ApiError(500, orderError?.message ?? 'Failed to create order')

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsPayload.map((item) => ({ ...item, order_id: order.id })))

    if (itemsError) throw new ApiError(500, itemsError.message)

    return NextResponse.json({ order })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error creating order' }, { status: 500 })
  }
}
