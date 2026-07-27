'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { EducationalVideo } from '@/lib/types'

export default function VideoForm({ video }: { video?: EducationalVideo }) {
  const router = useRouter()
  const [title, setTitle] = useState(video?.title ?? '')
  const [subject, setSubject] = useState(video?.subject ?? '')
  const [videoUrl, setVideoUrl] = useState(video?.video_url ?? '')
  const [description, setDescription] = useState(video?.description ?? '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const url = video ? `/api/videos/update/${video.id}` : '/api/videos'
    const method = video ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, subject, video_url: videoUrl, description }),
    })

    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Failed to save video')
      return
    }

    toast.success(video ? 'Video updated' : 'Uploaded as draft — submit it for approval from your list')
    router.push('/admin/subjects/videos')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-xl p-4 space-y-4 max-w-lg">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="video_url">Video URL (YouTube or Vimeo)</Label>
        <Input
          id="video_url"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>
      <Button type="submit" disabled={submitting} className="w-full">
        {video ? 'Save changes' : 'Upload as draft'}
      </Button>
    </form>
  )
}
