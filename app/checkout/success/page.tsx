import Link from 'next/link'
import { CheckCircle2, XCircle } from 'lucide-react'
import { finalizeDpoPayment } from '@/lib/dpo-finalize'
import ClearCartOnSuccess from '@/components/checkout/ClearCartOnSuccess'
import { Button } from '@/components/ui/button'

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ TransactionToken?: string }>
}) {
  const { TransactionToken } = await searchParams

  const outcome = TransactionToken
    ? await finalizeDpoPayment(TransactionToken)
    : { success: false as const, order: null, result: null }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      {outcome.success ? (
        <>
          <ClearCartOnSuccess />
          <CheckCircle2 className="mx-auto text-green-600 mb-4" size={48} />
          <h1 className="text-xl font-bold mb-2">Payment received</h1>
          <p className="text-gray-500 mb-6">
            Thanks{outcome.order ? `, ${outcome.order.customer_name}` : ''}! Your order is
            confirmed. Any exam papers you purchased are now available in your dashboard.
          </p>
          <Link href="/dashboard">
            <Button>Go to dashboard</Button>
          </Link>
        </>
      ) : (
        <>
          <XCircle className="mx-auto text-red-600 mb-4" size={48} />
          <h1 className="text-xl font-bold mb-2">Payment not confirmed</h1>
          <p className="text-gray-500 mb-6">
            We couldn&apos;t confirm this payment. If money was deducted, contact us and we&apos;ll sort it out.
          </p>
          <Link href="/checkout">
            <Button variant="outline">Back to checkout</Button>
          </Link>
        </>
      )}
    </div>
  )
}
