import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import type { Role } from '@/lib/types'

const ROLE_HOME: Record<Role, string> = {
  super_admin: '/admin/super',
  shop_admin: '/admin/shop',
  subject_admin: '/admin/subjects',
  student_parent: '/dashboard',
}

// Handles the PKCE redirect Supabase sends after a user clicks an email
// confirmation (or magic link) — the browser client uses flowType: 'pkce',
// so a `?code=` param needs to be exchanged for a session here before the
// user actually has a cookie-backed session.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const role = profile?.role as Role | undefined
        return NextResponse.redirect(new URL(role ? ROLE_HOME[role] : '/dashboard', request.url))
      }
    }
  }

  return NextResponse.redirect(new URL('/login', request.url))
}
