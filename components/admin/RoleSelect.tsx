'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { Role } from '@/lib/types'

const ROLES: Role[] = ['super_admin', 'shop_admin', 'subject_admin', 'student_parent']

export default function RoleSelect({ userId, currentRole }: { userId: string; currentRole: Role }) {
  const router = useRouter()
  const [role, setRole] = useState<Role>(currentRole)
  const [saving, setSaving] = useState(false)

  async function handleChange(newRole: Role) {
    setRole(newRole)
    setSaving(true)
    const res = await fetch(`/api/admin/super/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Failed to update role')
      setRole(currentRole)
      return
    }
    toast.success('Role updated')
    router.refresh()
  }

  return (
    <select
      value={role}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value as Role)}
      className="border rounded-lg px-2 py-1.5 text-sm"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  )
}
