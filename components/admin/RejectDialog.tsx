'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export default function RejectDialog({
  endpoint,
  open,
  onOpenChange,
  onRejected,
}: {
  endpoint: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onRejected: () => void
}) {
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleReject() {
    if (!comment.trim()) {
      toast.error('A rejection comment is required')
      return
    }
    setSubmitting(true)
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment }),
    })
    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Failed to reject')
      return
    }
    toast.success('Resource rejected')
    setComment('')
    onOpenChange(false)
    onRejected()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject with comment</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Explain what needs to change..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleReject} disabled={submitting}>
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
