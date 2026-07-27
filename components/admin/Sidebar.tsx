import Link from 'next/link'
import type { Role } from '@/lib/types'

const SUPER_NAV = [
  { href: '/admin/super/approvals', label: 'Approvals' },
  { href: '/admin/super/users', label: 'Users' },
  { href: '/admin/super/analytics', label: 'Analytics' },
]

const SHOP_NAV = [
  { href: '/admin/shop/stores', label: 'Stores' },
  { href: '/admin/shop/orders', label: 'Orders' },
  { href: '/admin/shop/fulfillment', label: 'Fulfillment' },
]

const SUBJECT_NAV = [
  { href: '/admin/subjects', label: 'My Resources' },
  { href: '/admin/subjects/new', label: 'Upload New' },
  { href: '/admin/subjects/videos', label: 'Videos' },
  { href: '/admin/subjects/news', label: 'News & Events' },
]

const NAV: Record<Role, { href: string; label: string }[]> = {
  super_admin: [...SUPER_NAV, ...SHOP_NAV, ...SUBJECT_NAV],
  shop_admin: SHOP_NAV,
  subject_admin: SUBJECT_NAV,
  student_parent: [],
}

export default function Sidebar({ role }: { role: Role | null }) {
  const items = role ? NAV[role] : []
  return (
    <aside className="w-56 shrink-0 bg-primary p-4 space-y-1 min-h-[calc(100vh-4rem)]">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="block text-sm px-3 py-2 rounded-lg text-primary-foreground/85 hover:bg-white/10 hover:text-[#C9A227] transition-colors"
        >
          {item.label}
        </Link>
      ))}
    </aside>
  )
}
