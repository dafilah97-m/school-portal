'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/lib/types'

export default function TeacherReviewCard({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function handleAction(action: 'approve' | 'dismiss') {
    setSubmitting(true)
    const res = await fetch(`/api/admin/super/teacher-review/${profile.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Failed to update')
      return
    }
    toast.success(action === 'approve' ? 'Promoted to Subject Admin' : 'Dismissed')
    router.refresh()
  }

  return (
    <div className="border rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted" />
        )}
        <div>
          <p className="font-medium">{profile.full_name || profile.email}</p>
          <p className="text-xs text-gray-500">
            {profile.email} · Teaches: {profile.teacher_subject || '—'}
          </p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button size="sm" onClick={() => handleAction('approve')} disabled={submitting}>
          Approve → Subject Admin
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleAction('dismiss')} disabled={submitting}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
