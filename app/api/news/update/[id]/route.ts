import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { requireRole } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'

export async function PATCH(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole('subject_admin', 'super_admin')
    const { id } = await segmentData.params
    const body = await request.json()

    const updates: Record<string, unknown> = {}
    if (body.title != null) updates.title = body.title
    if (body.body != null) updates.body = body.body
    if (body.event_date !== undefined) updates.event_date = body.event_date || null

    if (Object.keys(updates).length === 0) throw new ApiError(400, 'Nothing to update')

    const supabase = await createClient()
    const { data: post, error } = await supabase
      .from('news_events')
      .update(updates)
      .eq('id', id)
      .eq('created_by', user.id)
      .select()
      .single()

    if (error || !post) throw new ApiError(404, 'Post not found or not editable')

    return NextResponse.json({ post })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error updating post' }, { status: 500 })
  }
}
