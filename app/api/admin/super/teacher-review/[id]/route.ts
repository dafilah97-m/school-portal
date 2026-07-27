import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'
import { requireRole } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'

export async function PATCH(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole('super_admin')
    const { id } = await segmentData.params
    const { action } = await request.json()

    if (action !== 'approve' && action !== 'dismiss') {
      throw new ApiError(400, 'action must be "approve" or "dismiss"')
    }

    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, occupation, teacher_subject')
      .eq('id', id)
      .single()

    if (!profile || profile.occupation !== 'teacher') {
      throw new ApiError(404, 'No pending teacher review for this user')
    }

    // Promoting a role is restricted to the service-role client — the
    // same boundary /api/admin/super/users/[id]/role uses.
    const serviceClient = await createServiceClient()

    if (action === 'approve') {
      await serviceClient
        .from('profiles')
        .update({
          role: 'subject_admin',
          assigned_subject: profile.teacher_subject,
          teacher_review_status: 'approved',
        })
        .eq('id', id)
    } else {
      await serviceClient
        .from('profiles')
        .update({ teacher_review_status: 'dismissed' })
        .eq('id', id)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error updating teacher review' }, { status: 500 })
  }
}
