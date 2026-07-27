import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { requireRole } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'

export async function POST(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole('super_admin')
    const { id } = await segmentData.params

    const supabase = await createClient()
    const { data: post, error } = await supabase
      .from('news_events')
      .update({
        status: 'published',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        rejection_comment: null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error || !post) throw new ApiError(404, 'Post not found')

    return NextResponse.json({ post })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error approving post' }, { status: 500 })
  }
}
