'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { NewsEvent } from '@/lib/types'

const STATUS_VARIANT: Record<NewsEvent['status'], 'secondary' | 'default' | 'outline' | 'destructive'> = {
  draft: 'secondary',
  pending_approval: 'outline',
  published: 'default',
  rejected: 'destructive',
}

export default function NewsRow({ post }: { post: NewsEvent }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    const res = await fetch(`/api/news/submit/${post.id}`, { method: 'POST' })
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
        <p className="font-medium">{post.title}</p>
        <p className="text-xs text-gray-500">
          {post.event_date ? new Date(post.event_date).toLocaleDateString() : 'News post'}
        </p>
        {post.status === 'rejected' && post.rejection_comment && (
          <p className="text-xs text-red-600 mt-1">Rejected: {post.rejection_comment}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={STATUS_VARIANT[post.status]}>{post.status}</Badge>
        {(post.status === 'draft' || post.status === 'rejected') && (
          <>
            <Link href={`/admin/subjects/news/${post.id}/edit`}>
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
