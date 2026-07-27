import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { requireRole } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'

export async function POST(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole('super_admin')
    const { id } = await segmentData.params
    const { comment } = await request.json()

    if (!comment || typeof comment !== 'string') {
      throw new ApiError(400, 'A rejection comment is required')
    }

    const supabase = await createClient()
    const { data: video, error } = await supabase
      .from('educational_videos')
      .update({ status: 'rejected', rejection_comment: comment })
      .eq('id', id)
      .select()
      .single()

    if (error || !video) throw new ApiError(404, 'Video not found')

    return NextResponse.json({ video })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error rejecting video' }, { status: 500 })
  }
}
