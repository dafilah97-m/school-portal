import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { requireRole, assertSubjectMatch } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'

export async function PATCH(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const { user, role, assignedSubject } = await requireRole('subject_admin', 'super_admin')
    const { id } = await segmentData.params
    const body = await request.json()

    if (body.subject != null) assertSubjectMatch(role, assignedSubject, body.subject)

    const updates: Record<string, unknown> = {}
    if (body.title != null) updates.title = body.title
    if (body.subject != null) updates.subject = body.subject
    if (body.grade_level !== undefined) updates.grade_level = body.grade_level || null
    if (body.year !== undefined) updates.year = body.year ? Number(body.year) : null
    if (body.price != null) updates.price = Number(body.price)

    if (Object.keys(updates).length === 0) throw new ApiError(400, 'Nothing to update')

    const supabase = await createClient()
    const { data: resource, error } = await supabase
      .from('edu_resources')
      .update(updates)
      .eq('id', id)
      .eq('created_by', user.id)
      .select()
      .single()

    if (error || !resource) throw new ApiError(404, 'Resource not found or not editable')

    return NextResponse.json({ resource })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error updating resource' }, { status: 500 })
  }
}
