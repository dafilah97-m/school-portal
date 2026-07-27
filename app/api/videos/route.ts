import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { requireRole } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole('subject_admin', 'super_admin')
    const { title, description, video_url, subject } = await request.json()

    if (!title || !video_url) throw new ApiError(400, 'title and video_url are required')

    const supabase = await createClient()
    const { data: video, error } = await supabase
      .from('educational_videos')
      .insert({
        title,
        description: description || null,
        video_url,
        subject: subject || null,
        status: 'draft',
        created_by: user.id,
      })
      .select()
      .single()

    if (error || !video) throw new ApiError(400, error?.message ?? 'Failed to create video')

    return NextResponse.json({ video })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error creating video' }, { status: 500 })
  }
}
