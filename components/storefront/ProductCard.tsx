'use client'

import { useState } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/cart-store'
import type { Product } from '@/lib/types'

export default function ProductCard({ product }: { product: Product }) {
  const [size, setSize] = useState<string>(product.sizes?.[0] ?? '')
  const [customText, setCustomText] = useState('')
  const addItem = useCartStore((s) => s.addItem)

  function handleAdd() {
    if (product.sizes.length > 0 && !size) {
      toast.error('Select a size first')
      return
    }
    addItem({
      type: 'product',
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.images?.[0] ?? null,
      selectedSize: product.sizes.length > 0 ? size : null,
      customText: customText || null,
    })
    toast.success(`${product.title} added to cart`)
  }

  return (
    <div className="border rounded-xl overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-gray-100">
        {product.images?.[0] ? (
          <Image src={product.images[0]} alt={product.title} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300 text-sm">No image</div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2">
        <p className="font-medium">{product.title}</p>
        {product.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
        )}
        <p className="font-semibold">P{product.price.toFixed(2)}</p>

        {product.sizes.length > 0 && (
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm"
          >
            {product.sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}

        {product.customization_fields?.map((field) => (
          <input
            key={field.label}
            placeholder={field.label}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm"
          />
        ))}

        <Button onClick={handleAdd} className="mt-auto w-full">
          Add to cart
        </Button>
      </div>
    </div>
  )
}
