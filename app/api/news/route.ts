import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { requireRole } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole('subject_admin', 'super_admin')
    const { title, body, event_date } = await request.json()

    if (!title || !body) throw new ApiError(400, 'title and body are required')

    const supabase = await createClient()
    const { data: post, error } = await supabase
      .from('news_events')
      .insert({
        title,
        body,
        event_date: event_date || null,
        status: 'draft',
        created_by: user.id,
      })
      .select()
      .single()

    if (error || !post) throw new ApiError(400, error?.message ?? 'Failed to create post')

    return NextResponse.json({ post })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error creating post' }, { status: 500 })
  }
}
