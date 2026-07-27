import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { requireRole } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'

export async function POST(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole('subject_admin', 'super_admin')
    const { id } = await segmentData.params

    const supabase = await createClient()
    const { data: resource, error } = await supabase
      .from('edu_resources')
      .update({ status: 'pending_approval' })
      .eq('id', id)
      .eq('created_by', user.id)
      .select()
      .single()

    if (error || !resource) throw new ApiError(404, 'Resource not found or not yours to submit')

    return NextResponse.json({ resource })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error submitting resource' }, { status: 500 })
  }
}
