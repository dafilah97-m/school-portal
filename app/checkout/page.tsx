'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useCartStore } from '@/lib/cart-store'
import { checkoutSchema, type CheckoutInput } from '@/lib/validations/checkout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total())
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutInput>({ resolver: zodResolver(checkoutSchema) })

  useEffect(() => {
    if (items.length === 0) router.replace('/')
  }, [items.length, router])

  async function onSubmit(values: CheckoutInput) {
    setSubmitting(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login?redirect=/checkout')
      return
    }

    try {
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          items: items.map((i) => ({
            type: i.type,
            id: i.id,
            quantity: i.quantity,
            selectedSize: i.selectedSize,
            customText: i.customText,
          })),
        }),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error || 'Could not create order')

      const payRes = await fetch('/api/payments/dpo/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderData.order.id }),
      })
      const payData = await payRes.json()
      if (!payRes.ok) throw new Error(payData.error || 'Could not start payment')

      window.location.assign(payData.redirectUrl)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Checkout failed')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="border rounded-xl p-4 mb-6 space-y-2">
        {items.map((item) => (
          <div key={`${item.type}-${item.id}-${item.selectedSize ?? 'none'}`} className="flex justify-between text-sm">
            <span>
              {item.title} {item.quantity > 1 ? `× ${item.quantity}` : ''}
            </span>
            <span>P{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between font-semibold pt-2 border-t">
          <span>Total</span>
          <span>P{total.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="customer_name">Student / parent full name</Label>
          <Input id="customer_name" {...register('customer_name')} />
          {errors.customer_name && (
            <p className="text-xs text-red-600">{errors.customer_name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="customer_email">Email</Label>
          <Input id="customer_email" type="email" {...register('customer_email')} />
          {errors.customer_email && (
            <p className="text-xs text-red-600">{errors.customer_email.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="grade_class">Grade & section (for pre-sorted shipping)</Label>
          <Input id="grade_class" placeholder="e.g. Grade 10B" {...register('grade_class')} />
          {errors.grade_class && (
            <p className="text-xs text-red-600">{errors.grade_class.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 size={16} className="animate-spin mr-2" />}
          Pay with DPO
        </Button>
      </form>
    </div>
  )
}
