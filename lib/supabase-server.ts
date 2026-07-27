import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getCookies() {
  const cookieStore = await cookies()
  return {
    getAll() {
      return cookieStore.getAll()
    },
    setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options ?? {})
        )
      } catch {
        // called from a Server Component with no request/response to write to — safe to ignore
      }
    },
  }
}

export async function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: await getCookies() }
  )
}

// Bypasses RLS — use only for operations that must not be forgeable by the
// client: payment confirmation, purchased_resources writes, role changes,
// and the watermark cache.
export async function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: await getCookies() }
  )
}
