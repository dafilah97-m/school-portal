'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { EducationalVideo } from '@/lib/types'

const STATUS_VARIANT: Record<EducationalVideo['status'], 'secondary' | 'default' | 'outline' | 'destructive'> = {
  draft: 'secondary',
  pending_approval: 'outline',
  published: 'default',
  rejected: 'destructive',
}

export default function VideoRow({ video }: { video: EducationalVideo }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    const res = await fetch(`/api/videos/submit/${video.id}`, { method: 'POST' })
    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Failed to submit')
      return
    }
    toast.success('Submitted for approval')
    router.refresh()
  }

  return (
    <div className="p-4 flex items-center justify-between gap-4">
      <div>
        <p className="font-medium">{video.title}</p>
        <p className="text-xs text-gray-500">{video.subject || 'General'}</p>
        {video.status === 'rejected' && video.rejection_comment && (
          <p className="text-xs text-red-600 mt-1">Rejected: {video.rejection_comment}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={STATUS_VARIANT[video.status]}>{video.status}</Badge>
        {(video.status === 'draft' || video.status === 'rejected') && (
          <>
            <Link href={`/admin/subjects/videos/${video.id}/edit`}>
              <Button size="sm" variant="outline">
                Edit
              </Button>
            </Link>
            <Button size="sm" onClick={handleSubmit} disabled={submitting}>
              Submit
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
