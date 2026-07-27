'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function UploadResourceForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [year, setYear] = useState('')
  const [price, setPrice] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => setFile(files[0] ?? null),
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      toast.error('Attach a PDF file')
      return
    }
    setSubmitting(true)

    const form = new FormData()
    form.append('file', file)
    form.append('title', title)
    form.append('subject', subject)
    form.append('grade_level', gradeLevel)
    form.append('year', year)
    form.append('price', price)

    const res = await fetch('/api/edu-vault/upload', { method: 'POST', body: form })
    setSubmitting(false)

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Upload failed')
      return
    }

    toast.success('Uploaded as draft — submit it for approval from your resources list')
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

      <div className="space-y-1.5">
        <Label>PDF file</Label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center text-sm cursor-pointer ${
            isDragActive ? 'border-gray-900 bg-gray-50' : 'border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          <p className="text-gray-500">{file ? file.name : 'Drag a PDF here, or click to select'}</p>
        </div>
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        Upload as draft
      </Button>
    </form>
  )
}
