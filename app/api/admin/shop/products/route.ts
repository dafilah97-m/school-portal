import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { requireRole } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  try {
    await requireRole('shop_admin', 'super_admin')
    const body = await request.json()

    if (!body.store_id || !body.title || body.price == null) {
      throw new ApiError(400, 'store_id, title, and price are required')
    }

    const supabase = await createClient()
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        store_id: body.store_id,
        title: body.title,
        description: body.description || null,
        price: Number(body.price),
        fundraising_markup: Number(body.fundraising_markup || 0),
        sizes: body.sizes || [],
        customization_fields: body.customization_fields || [],
        images: body.images || [],
      })
      .select()
      .single()

    if (error || !product) throw new ApiError(400, error?.message ?? 'Failed to create product')

    return NextResponse.json({ product })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error creating product' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole('shop_admin', 'super_admin')
    const { id, ...updates } = await request.json()
    if (!id) throw new ApiError(400, 'id is required')

    const supabase = await createClient()
    const { data: product, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error || !product) throw new ApiError(400, error?.message ?? 'Failed to update product')

    return NextResponse.json({ product })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error updating product' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole('shop_admin', 'super_admin')
    const { id } = await request.json()
    if (!id) throw new ApiError(400, 'id is required')

    const supabase = await createClient()
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw new ApiError(400, error.message)

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error deleting product' }, { status: 500 })
  }
}
