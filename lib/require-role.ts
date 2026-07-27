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
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !roles.includes(profile.role as Role)) {
    throw new ApiError(403, 'Forbidden')
  }

  return { user, role: profile.role as Role }
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
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) throw new ApiError(403, 'Forbidden')

  return { user, role: profile.role as Role }
}
