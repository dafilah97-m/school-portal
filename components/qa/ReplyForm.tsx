'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export default function ReplyForm({ questionId }: { questionId: string }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() && !file) {
      toast.error('Write a reply or attach a file')
      return
    }
    setSubmitting(true)

    const form = new FormData()
    form.append('questionId', questionId)
    form.append('body', body)
    if (file) form.append('file', file)

    const res = await fetch('/api/qa/answers', { method: 'POST', body: form })
    setSubmitting(false)

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Failed to post reply')
      return
    }

    setBody('')
    setFile(null)
    toast.success('Reply posted')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-xl p-4 space-y-3">
      <Textarea
        placeholder="Write a reply..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
      />
      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="text-sm"
      />
      <Button type="submit" disabled={submitting} size="sm">
        Post reply
      </Button>
    </form>
  )
}
