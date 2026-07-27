'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { EduResource } from '@/lib/types'

export default function EditResourceForm({ resource }: { resource: EduResource }) {
  const router = useRouter()
  const [title, setTitle] = useState(resource.title)
  const [subject, setSubject] = useState(resource.subject)
  const [gradeLevel, setGradeLevel] = useState(resource.grade_level ?? '')
  const [year, setYear] = useState(resource.year?.toString() ?? '')
  const [price, setPrice] = useState(resource.price.toString())
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const res = await fetch(`/api/edu-vault/update/${resource.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, subject, grade_level: gradeLevel, year, price }),
    })

    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Failed to update')
      return
    }

    toast.success('Resource updated')
    router.push('/admin/subjects')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-xl p-4 space-y-4 max-w-lg">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="grade_level">Grade level</Label>
          <Input id="grade_level" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="year">Year</Label>
          <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">Price (P)</Label>
          <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
      </div>
      <Button type="submit" disabled={submitting}>
        Save changes
      </Button>
    </form>
  )
}
