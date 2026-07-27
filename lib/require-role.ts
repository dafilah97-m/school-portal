import { createClient } from '@/lib/supabase-server'
import { ApiError } from '@/lib/api-error'
import type { Role } from '@/lib/types'

// Server-side role guard for route handlers. Defense in depth beyond
// middleware and RLS — every mutating route calls this before touching data.
export async function requireRole(...roles: Role[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new ApiError(401, 'Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, assigned_subject')
    .eq('id', user.id)
    .single()

  if (!profile || !roles.includes(profile.role as Role)) {
    throw new ApiError(403, 'Forbidden')
  }

  return { user, role: profile.role as Role, assignedSubject: profile.assigned_subject as string | null }
}

// Same as requireRole but accepts any authenticated user regardless of role.
export async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new ApiError(401, 'Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, assigned_subject')
    .eq('id', user.id)
    .single()

  if (!profile) throw new ApiError(403, 'Forbidden')

  return { user, role: profile.role as Role, assignedSubject: profile.assigned_subject as string | null }
}

// A subject_admin with no assignment may post to any subject; one with an
// assignment is scoped to only that subject. Mirrors the RLS check in
// supabase/schema.sql (current_assigned_subject()) so the route handler can
// return a friendly error instead of a raw RLS-violation message.
export function assertSubjectMatch(role: Role, assignedSubject: string | null, subject: string) {
  if (role === 'subject_admin' && assignedSubject && assignedSubject !== subject) {
    throw new ApiError(403, `You are only assigned to teach ${assignedSubject}`)
  }
}
