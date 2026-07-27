'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { NewsEvent } from '@/lib/types'

export default function NewsForm({ post }: { post?: NewsEvent }) {
  const router = useRouter()
  const [title, setTitle] = useState(post?.title ?? '')
  const [body, setBody] = useState(post?.body ?? '')
  const [eventDate, setEventDate] = useState(post?.event_date ?? '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const url = post ? `/api/news/update/${post.id}` : '/api/news'
    const method = post ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, event_date: eventDate || null }),
    })

    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Failed to save post')
      return
    }

    toast.success(post ? 'Post updated' : 'Saved as draft — submit it for approval from your list')
    router.push('/admin/subjects/news')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-xl p-4 space-y-4 max-w-lg">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="event_date">Event date (leave blank for a news post)</Label>
        <Input id="event_date" type="date" value={eventDate ?? ''} onChange={(e) => setEventDate(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="body">Body</Label>
        <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={6} required />
      </div>
      <Button type="submit" disabled={submitting} className="w-full">
        {post ? 'Save changes' : 'Save as draft'}
      </Button>
    </form>
  )
}
