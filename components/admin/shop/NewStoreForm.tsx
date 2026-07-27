'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function NewStoreForm() {
  const router = useRouter()
  const [schoolName, setSchoolName] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/admin/shop/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_name: schoolName,
        slug: slugify(schoolName),
        end_date: endDate || null,
      }),
    })
    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Failed to create store')
      return
    }
    toast.success('Store created')
    setSchoolName('')
    setEndDate('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-xl p-4 flex flex-wrap items-end gap-3 mb-6">
      <div className="space-y-1.5">
        <Label htmlFor="school_name">School name</Label>
        <Input
          id="school_name"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="end_date">Closes on</Label>
        <Input id="end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <Button type="submit" disabled={submitting}>
        Create store
      </Button>
    </form>
  )
}
