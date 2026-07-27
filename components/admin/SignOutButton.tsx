'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full flex items-center gap-2 text-sm px-3 py-2 rounded-lg text-primary-foreground/85 hover:bg-white/10 hover:text-[#C9A227] transition-colors"
    >
      <LogOut size={16} />
      Sign out
    </button>
  )
}
