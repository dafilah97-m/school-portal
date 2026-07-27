'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/exams', label: 'Exams' },
]

export default function DashboardTopBar() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-primary text-primary-foreground sticky top-0 z-40 border-b border-[#14315C] shadow-sm">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-semibold tracking-tight shrink-0">
          <span className="text-[#C9A227]">SHG</span> School Portal
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-primary-foreground/85 hover:text-[#C9A227] transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-primary-foreground/85 hover:text-[#C9A227] transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </nav>
      </div>
    </header>
  )
}
