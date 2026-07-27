import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Role } from '@/lib/types'

const ALL_ROLES: Role[] = ['super_admin', 'shop_admin', 'subject_admin', 'student_parent']

const PROTECTED: { pattern: RegExp; roles: Role[] }[] = [
  { pattern: /^\/admin\/super/, roles: ['super_admin'] },
  { pattern: /^\/admin\/shop/, roles: ['super_admin', 'shop_admin'] },
  { pattern: /^\/admin\/subjects/, roles: ['super_admin', 'subject_admin'] },
  { pattern: /^\/dashboard/, roles: ALL_ROLES },
  { pattern: /^\/api\/admin\/shop/, roles: ['super_admin', 'shop_admin'] },
  { pattern: /^\/api\/admin\/super/, roles: ['super_admin'] },
  { pattern: /^\/api\/edu-vault\/(upload|submit)/, roles: ['super_admin', 'subject_admin'] },
  { pattern: /^\/api\/edu-vault\/(approve|reject)/, roles: ['super_admin'] },
  { pattern: /^\/api\/videos\/(approve|reject)/, roles: ['super_admin'] },
  { pattern: /^\/api\/videos/, roles: ['super_admin', 'subject_admin'] },
  { pattern: /^\/api\/news\/(approve|reject)/, roles: ['super_admin'] },
  { pattern: /^\/api\/news/, roles: ['super_admin', 'subject_admin'] },
]

const ROLE_HOME: Record<Role, string> = {
  super_admin: '/admin/super',
  shop_admin: '/admin/shop',
  subject_admin: '/admin/subjects',
  student_parent: '/dashboard',
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const rule = PROTECTED.find((r) => r.pattern.test(pathname))
  if (!rule) return NextResponse.next()

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options ?? {})
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isApi = pathname.startsWith('/api/')

  if (!user) {
    if (isApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role as Role | undefined

  if (!role || !rule.roles.includes(role)) {
    if (isApi) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.redirect(new URL(role ? ROLE_HOME[role] : '/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/api/admin/:path*',
    '/api/edu-vault/:path*',
    '/api/videos/:path*',
    '/api/news/:path*',
  ],
}
