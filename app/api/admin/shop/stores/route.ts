import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { requireRole } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  try {
    await requireRole('shop_admin', 'super_admin')
    const { school_name, slug, start_date, end_date } = await request.json()

    if (!school_name || !slug) throw new ApiError(400, 'school_name and slug are required')

    const supabase = await createClient()
    const { data: store, error } = await supabase
      .from('campaigns_stores')
      .insert({
        school_name,
        slug,
        start_date: start_date || null,
        end_date: end_date || null,
      })
      .select()
      .single()

    if (error || !store) throw new ApiError(400, error?.message ?? 'Failed to create store')

    return NextResponse.json({ store })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error creating store' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole('shop_admin', 'super_admin')
    const { id, ...updates } = await request.json()
    if (!id) throw new ApiError(400, 'id is required')

    const supabase = await createClient()
    const { data: store, error } = await supabase
      .from('campaigns_stores')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error || !store) throw new ApiError(400, error?.message ?? 'Failed to update store')

    return NextResponse.json({ store })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error updating store' }, { status: 500 })
  }
}
