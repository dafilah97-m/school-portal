'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItemType = 'product' | 'resource'

export interface CartItem {
  type: CartItemType
  id: string
  title: string
  price: number
  image?: string | null
  quantity: number
  selectedSize?: string | null
  customText?: string | null
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (type: CartItemType, id: string, selectedSize?: string | null) => void
  updateQuantity: (type: CartItemType, id: string, quantity: number, selectedSize?: string | null) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  total: () => number
  itemCount: () => number
}

function itemKey(type: CartItemType, id: string, selectedSize?: string | null) {
  return `${type}-${id}-${selectedSize ?? 'none'}`
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item, quantity = 1) => {
        // digital resources never carry a size, quantity is always 1
        const normalized =
          item.type === 'resource' ? { ...item, selectedSize: null } : item
        const qty = item.type === 'resource' ? 1 : quantity
        const key = itemKey(normalized.type, normalized.id, normalized.selectedSize)
        const items = get().items
        const existing = items.find(
          (i) => itemKey(i.type, i.id, i.selectedSize) === key
        )

        if (existing) {
          if (normalized.type === 'resource') {
            // already in cart, no-op
            set({ isOpen: true })
            return
          }
          set({
            items: items.map((i) =>
              itemKey(i.type, i.id, i.selectedSize) === key
                ? { ...i, quantity: i.quantity + qty }
                : i
            ),
            isOpen: true,
          })
        } else {
          set({ items: [...items, { ...normalized, quantity: qty }], isOpen: true })
        }
      },

      removeItem: (type, id, selectedSize = null) => {
        const key = itemKey(type, id, selectedSize)
        set({
          items: get().items.filter((i) => itemKey(i.type, i.id, i.selectedSize) !== key),
        })
      },

      updateQuantity: (type, id, quantity, selectedSize = null) => {
        if (type === 'resource') return // digital items are always quantity 1
        const key = itemKey(type, id, selectedSize)
        if (quantity <= 0) {
          get().removeItem(type, id, selectedSize)
          return
        }
        set({
          items: get().items.map((i) =>
            itemKey(i.type, i.id, i.selectedSize) === key ? { ...i, quantity } : i
          ),
        })
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'school-portal-cart' }
  )
)
