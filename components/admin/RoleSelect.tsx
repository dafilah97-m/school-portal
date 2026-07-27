'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import type { Role } from '@/lib/types'

const ROLES: Role[] = ['super_admin', 'shop_admin', 'subject_admin', 'student_parent']

export default function RoleSelect({
  userId,
  currentRole,
  currentAssignedSubject,
}: {
  userId: string
  currentRole: Role
  currentAssignedSubject: string | null
}) {
  const router = useRouter()
  const [role, setRole] = useState<Role>(currentRole)
  const [assignedSubject, setAssignedSubject] = useState(currentAssignedSubject ?? '')
  const [saving, setSaving] = useState(false)

  async function save(nextRole: Role, nextSubject: string) {
    setSaving(true)
    const res = await fetch(`/api/admin/super/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: nextRole, assigned_subject: nextSubject || null }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Failed to update')
      setRole(currentRole)
      setAssignedSubject(currentAssignedSubject ?? '')
      return
    }
    toast.success('Updated')
    router.refresh()
  }

  function handleRoleChange(newRole: Role) {
    setRole(newRole)
    save(newRole, assignedSubject)
  }

  function handleSubjectBlur() {
    if (assignedSubject === (currentAssignedSubject ?? '')) return
    save(role, assignedSubject)
  }

  return (
    <div className="flex items-center gap-2">
      {role === 'subject_admin' && (
        <Input
          value={assignedSubject}
          disabled={saving}
          onChange={(e) => setAssignedSubject(e.target.value)}
          onBlur={handleSubjectBlur}
          placeholder="Assigned subject (e.g. Mathematics)"
          className="h-8 text-sm w-48"
        />
      )}
      <select
        value={role}
        disabled={saving}
        onChange={(e) => handleRoleChange(e.target.value as Role)}
        className="border rounded-lg px-2 py-1.5 text-sm"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  )
}
