import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { requireRole } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'
import type { Role } from '@/lib/types'

const VALID_ROLES: Role[] = ['super_admin', 'shop_admin', 'subject_admin', 'student_parent']

export async function PATCH(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole('super_admin')
    const { id } = await segmentData.params
    const { role, assigned_subject } = await request.json()

    if (!VALID_ROLES.includes(role)) throw new ApiError(400, 'Invalid role')

    // service-role write: profile updates are RLS-locked to "role unchanged"
    // for a user's own row — only this endpoint, gated by requireRole, may
    // change anyone's role.
    const supabase = await createServiceClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ role, assigned_subject: assigned_subject ?? null })
      .eq('id', id)
      .select()
      .single()

    if (error || !profile) throw new ApiError(404, 'User not found')

    return NextResponse.json({ profile })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error updating role' }, { status: 500 })
  }
}
