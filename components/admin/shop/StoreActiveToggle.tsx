'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Switch } from '@/components/ui/switch'

export default function StoreActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter()
  const [checked, setChecked] = useState(isActive)
  const [saving, setSaving] = useState(false)

  async function handleChange(next: boolean) {
    setChecked(next)
    setSaving(true)
    const res = await fetch('/api/admin/shop/stores', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: next }),
    })
    setSaving(false)
    if (!res.ok) {
      setChecked(!next)
      toast.error('Failed to update store')
      return
    }
    router.refresh()
  }

  return <Switch checked={checked} disabled={saving} onCheckedChange={handleChange} />
}
