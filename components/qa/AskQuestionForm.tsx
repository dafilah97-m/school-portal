'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function AskQuestionForm() {
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const form = new FormData()
    form.append('subject', subject)
    form.append('title', title)
    form.append('body', body)
    if (file) form.append('file', file)

    const res = await fetch('/api/qa/questions', { method: 'POST', body: form })
    setSubmitting(false)

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Failed to post question')
      return
    }

    const { question } = await res.json()
    toast.success('Question posted')
    router.push(`/qa/${question.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-xl p-4 space-y-4 max-w-lg">
      <div className="space-y-1.5">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="title">Question</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="body">Details (optional)</Label>
        <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="file">Attach a PDF or image (optional)</Label>
        <input
          id="file"
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
      </div>
      <Button type="submit" disabled={submitting} className="w-full">
        Post question
      </Button>
    </form>
  )
}
