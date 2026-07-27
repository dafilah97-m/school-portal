'use client'

import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/cart-store'
import type { EduResourcePublic } from '@/lib/types'

export default function ResourceCard({ resource }: { resource: EduResourcePublic }) {
  const addItem = useCartStore((s) => s.addItem)

  function handleAdd() {
    addItem({
      type: 'resource',
      id: resource.id,
      title: resource.title,
      price: resource.price,
    })
    toast.success(`${resource.title} added to cart`)
  }

  return (
    <div className="border rounded-xl p-5 flex flex-col gap-2">
      <p className="font-medium">{resource.title}</p>
      <p className="text-sm text-gray-500">
        {resource.subject}
        {resource.grade_level ? ` · ${resource.grade_level}` : ''}
        {resource.year ? ` · ${resource.year}` : ''}
      </p>
      <p className="font-semibold">P{resource.price.toFixed(2)}</p>
      <Button onClick={handleAdd} className="mt-auto w-full">
        Add to cart
      </Button>
    </div>
  )
}
