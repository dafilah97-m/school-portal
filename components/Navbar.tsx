'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ShoppingCart, User, LogOut, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useCartStore } from '@/lib/cart-store'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import type { Role } from '@/lib/types'

const ROLE_HOME: Record<Role, string> = {
  super_admin: '/admin/super',
  shop_admin: '/admin/shop',
  subject_admin: '/admin/subjects',
  student_parent: '/dashboard',
}

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/exams', label: 'Exams' },
  { href: '/news-events', label: 'News & Events' },
  { href: '/qa', label: 'Q&A' },
]

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [role, setRole] = useState<Role | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const itemCount = useCartStore((s) => s.itemCount())
  const openCart = useCartStore((s) => s.openCart)

  useEffect(() => {
    const supabase = createClient()

    async function loadRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setRole(null)
        setAvatarUrl(null)
        setLoaded(true)
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, avatar_url')
        .eq('id', user.id)
        .single()
      setRole((profile?.role as Role) ?? null)
      setAvatarUrl(profile?.avatar_url ?? null)
      setLoaded(true)
    }

    loadRole()

    const { data: sub } = supabase.auth.onAuthStateChange(() => loadRole())
    return () => sub.subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // /admin and /dashboard have their own sidebar/dashboard navigation —
  // the public marketing navbar would just be redundant clutter there.
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    return null
  }

  return (
    <header className="bg-primary text-primary-foreground sticky top-0 z-40 border-b border-[#14315C] shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="font-semibold text-lg tracking-tight shrink-0">
          <span className="text-[#C9A227]">SHG</span> School Portal
        </Link>

        <nav className="hidden sm:flex items-center gap-6 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-primary-foreground/85 hover:text-[#C9A227] transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={openCart}
            className="relative flex items-center gap-1.5 text-primary-foreground/85 hover:text-[#C9A227] transition-colors"
          >
            <ShoppingCart size={16} />
            Cart
            {itemCount > 0 && (
              <span className="ml-0.5 bg-[#C9A227] text-[#0B2545] text-[10px] font-semibold rounded-full h-4 w-4 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={openCart}
            className="relative p-2 rounded-lg hover:bg-white/10 sm:hidden"
            aria-label="Open cart"
          >
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#C9A227] text-[#0B2545] text-[10px] font-semibold rounded-full h-4 w-4 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>

          {loaded && role ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="p-1.5 rounded-lg hover:bg-white/10 flex items-center gap-1 text-sm outline-none">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <User size={18} />
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(ROLE_HOME[role])}>
                  <LayoutDashboard size={14} />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
                  <LogOut size={14} />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : loaded ? (
            <Link
              href="/login"
              className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-[#C9A227] text-[#0B2545] hover:bg-[#DDBA45] transition-colors"
            >
              Sign in
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  )
}
