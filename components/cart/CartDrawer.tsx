'use client'

import Link from 'next/link'
import { Minus, Plus, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/cart-store'

export default function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen)
  const closeCart = useCartStore((s) => s.closeCart)
  const items = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const total = useCartStore((s) => s.total())

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Your cart</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 space-y-4">
          {items.length === 0 && (
            <p className="text-sm text-gray-500 py-8 text-center">Your cart is empty.</p>
          )}

          {items.map((item) => (
            <div
              key={`${item.type}-${item.id}-${item.selectedSize ?? 'none'}`}
              className="flex items-center gap-3 border-b pb-4"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                {item.selectedSize && (
                  <p className="text-xs text-gray-500">Size: {item.selectedSize}</p>
                )}
                {item.customText && (
                  <p className="text-xs text-gray-500">Text: {item.customText}</p>
                )}
                <p className="text-xs text-gray-500 capitalize">{item.type === 'resource' ? 'Digital resource' : 'Merchandise'}</p>
                <p className="text-sm font-semibold mt-1">P{item.price.toFixed(2)}</p>
              </div>

              {item.type === 'product' ? (
                <div className="flex items-center gap-1">
                  <button
                    className="p-1 rounded border hover:bg-gray-50"
                    onClick={() => updateQuantity(item.type, item.id, item.quantity - 1, item.selectedSize)}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <button
                    className="p-1 rounded border hover:bg-gray-50"
                    onClick={() => updateQuantity(item.type, item.id, item.quantity + 1, item.selectedSize)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ) : null}

              <button
                className="p-1 text-gray-400 hover:text-gray-700"
                onClick={() => removeItem(item.type, item.id, item.selectedSize)}
                aria-label="Remove item"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>

        <SheetFooter>
          <div className="flex items-center justify-between text-sm font-medium px-4">
            <span>Total</span>
            <span>P{total.toFixed(2)}</span>
          </div>
          <Link href="/checkout" onClick={closeCart}>
            <Button className="w-full" disabled={items.length === 0}>
              Checkout
            </Button>
          </Link>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
