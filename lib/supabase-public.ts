import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// A cookie-free anon client for genuinely public, unauthenticated reads
// (storefront, Edu-Vault listing, home page). Unlike lib/supabase-server.ts,
// this never touches next/headers cookies(), so pages using it can stay
// statically generated / ISR-cached instead of being forced dynamic —
// needed for the sub-100ms public catalog page target.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
