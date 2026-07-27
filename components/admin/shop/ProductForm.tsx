'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import ImageUpload from '@/components/admin/ImageUpload'

export default function ProductForm({ storeId }: { storeId: string }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [markup, setMarkup] = useState('')
  const [sizes, setSizes] = useState('S, M, L, XL')
  const [images, setImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const res = await fetch('/api/admin/shop/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: storeId,
        title,
        description,
        price: Number(price),
        fundraising_markup: Number(markup || 0),
        sizes: sizes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        images,
      }),
    })

    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Failed to create product')
      return
    }

    toast.success('Product created')
    setTitle('')
    setDescription('')
    setPrice('')
    setMarkup('')
    setImages([])
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-xl p-4 space-y-4 mb-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">Price (P)</Label>
          <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="markup">Fundraising markup (P)</Label>
          <Input id="markup" type="number" step="0.01" value={markup} onChange={(e) => setMarkup(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sizes">Sizes (comma separated)</Label>
          <Input id="sizes" value={sizes} onChange={(e) => setSizes(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>

      <div className="space-y-1.5">
        <Label>Images</Label>
        <ImageUpload images={images} onChange={setImages} />
      </div>

      <Button type="submit" disabled={submitting}>
        Add product
      </Button>
    </form>
  )
}
