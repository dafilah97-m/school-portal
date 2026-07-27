'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Test } from '@/lib/types'

const STATUS_VARIANT: Record<Test['status'], 'secondary' | 'default' | 'outline' | 'destructive'> = {
  draft: 'secondary',
  pending_approval: 'outline',
  published: 'default',
  rejected: 'destructive',
}

export default function TestRow({ test }: { test: Test }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    const res = await fetch(`/api/tests/submit/${test.id}`, { method: 'POST' })
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
        <p className="font-medium">{test.title}</p>
        <p className="text-xs text-gray-500">
          {test.subject}
          {test.grade_level ? ` · ${test.grade_level}` : ''} · {test.duration_minutes} min
        </p>
        {test.status === 'rejected' && test.rejection_comment && (
          <p className="text-xs text-red-600 mt-1">Rejected: {test.rejection_comment}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={STATUS_VARIANT[test.status]}>{test.status}</Badge>
        {(test.status === 'draft' || test.status === 'rejected') && (
          <>
            <Link href={`/admin/subjects/tests/${test.id}/edit`}>
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
