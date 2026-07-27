'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { FulfillmentStatus, PaymentStatus } from '@/lib/types'

const FULFILLMENT_OPTIONS: FulfillmentStatus[] = ['unfulfilled', 'processing', 'delivered']
const PAYMENT_OPTIONS: PaymentStatus[] = ['pending', 'paid', 'failed']

export default function OrderRow({
  order,
}: {
  order: {
    id: string
    customer_name: string
    customer_email: string
    grade_class: string | null
    total_amount: number
    payment_status: PaymentStatus
    fulfillment_status: FulfillmentStatus
    created_at: string
    order_items: { id: string }[]
  }
}) {
  const router = useRouter()
  const [fulfillment, setFulfillment] = useState(order.fulfillment_status)
  const [payment, setPayment] = useState(order.payment_status)
  const [saving, setSaving] = useState(false)

  async function update(fields: { fulfillment_status?: string; payment_status?: string }) {
    setSaving(true)
    const res = await fetch(`/api/admin/shop/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    setSaving(false)
    if (!res.ok) {
      toast.error('Failed to update order')
      return
    }
    router.refresh()
  }

  return (
    <tr className="border-b last:border-0">
      <td className="p-3 text-sm">
        <p className="font-medium">{order.customer_name}</p>
        <p className="text-xs text-gray-500">{order.customer_email}</p>
      </td>
      <td className="p-3 text-sm">{order.grade_class || '—'}</td>
      <td className="p-3 text-sm">{order.order_items?.length ?? 0}</td>
      <td className="p-3 text-sm">P{Number(order.total_amount).toFixed(2)}</td>
      <td className="p-3 text-sm">
        <select
          value={payment}
          disabled={saving}
          onChange={(e) => {
            const next = e.target.value as PaymentStatus
            setPayment(next)
            update({ payment_status: next })
          }}
          className="border rounded-lg px-2 py-1 text-xs"
        >
          {PAYMENT_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </td>
      <td className="p-3 text-sm">
        <select
          value={fulfillment}
          disabled={saving}
          onChange={(e) => {
            const next = e.target.value as FulfillmentStatus
            setFulfillment(next)
            update({ fulfillment_status: next })
          }}
          className="border rounded-lg px-2 py-1 text-xs"
        >
          {FULFILLMENT_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </td>
      <td className="p-3 text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
    </tr>
  )
}
