import { createClient } from '@/lib/supabase-server'
import Sidebar from '@/components/admin/Sidebar'
import type { Role } from '@/lib/types'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let role: Role | null = null
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    role = (profile?.role as Role) ?? null
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)]">
      <Sidebar role={role} />
      <div className="flex-1 p-6 max-w-5xl">{children}</div>
    </div>
  )
}
