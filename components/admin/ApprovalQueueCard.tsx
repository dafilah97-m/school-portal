'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import RejectDialog from '@/components/admin/RejectDialog'

export default function ApprovalQueueCard({
  title,
  subtitle,
  approveEndpoint,
  rejectEndpoint,
}: {
  title: string
  subtitle: string
  approveEndpoint: string
  rejectEndpoint: string
}) {
  const router = useRouter()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [approving, setApproving] = useState(false)

  async function handleApprove() {
    setApproving(true)
    const res = await fetch(approveEndpoint, { method: 'POST' })
    setApproving(false)
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Failed to approve')
      return
    }
    toast.success('Approved and published')
    router.refresh()
  }

  return (
    <div className="border rounded-xl p-4 flex items-center justify-between gap-4">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button size="sm" onClick={handleApprove} disabled={approving}>
          Approve
        </Button>
        <Button size="sm" variant="outline" onClick={() => setRejectOpen(true)}>
          Reject
        </Button>
      </div>

      <RejectDialog
        endpoint={rejectEndpoint}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onRejected={() => router.refresh()}
      />
    </div>
  )
}
