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

    const { count } = await supabase
      .from('test_questions')
      .select('id', { count: 'exact', head: true })
      .eq('test_id', id)

    if (!count) throw new ApiError(400, 'Add at least one question before submitting')

    const { data: test, error } = await supabase
      .from('tests')
      .update({ status: 'pending_approval' })
      .eq('id', id)
      .eq('created_by', user.id)
      .select()
      .single()

    if (error || !test) throw new ApiError(404, 'Test not found or not yours to submit')

    return NextResponse.json({ test })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error submitting test' }, { status: 500 })
  }
}
