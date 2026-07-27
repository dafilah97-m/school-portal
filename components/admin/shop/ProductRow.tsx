'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import type { Product } from '@/lib/types'

export default function ProductRow({ product }: { product: Product }) {
  const router = useRouter()
  const [isActive, setIsActive] = useState(product.is_active)
  const [saving, setSaving] = useState(false)

  async function toggleActive(next: boolean) {
    setIsActive(next)
    setSaving(true)
    const res = await fetch('/api/admin/shop/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id, is_active: next }),
    })
    setSaving(false)
    if (!res.ok) {
      setIsActive(!next)
      toast.error('Failed to update product')
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${product.title}"?`)) return
    const res = await fetch('/api/admin/shop/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id }),
    })
    if (!res.ok) {
      toast.error('Failed to delete product')
      return
    }
    toast.success('Product deleted')
    router.refresh()
  }

  return (
    <div className="flex items-center justify-between p-4">
      <div>
        <p className="font-medium">{product.title}</p>
        <p className="text-xs text-gray-500">
          P{product.price.toFixed(2)}
          {product.sizes.length > 0 ? ` · Sizes: ${product.sizes.join(', ')}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Switch checked={isActive} disabled={saving} onCheckedChange={toggleActive} />
        <Button size="sm" variant="destructive" onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </div>
  )
}
