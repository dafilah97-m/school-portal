import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { requireUser } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'
import { uploadQaAttachment } from '@/lib/qa-attachment'

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireUser()
    const form = await request.formData()

    const subject = form.get('subject') as string | null
    const title = form.get('title') as string | null
    const body = form.get('body') as string | null
    const file = form.get('file') as File | null

    if (!subject || !title) throw new ApiError(400, 'subject and title are required')

    const supabase = await createClient()

    let attachment_url: string | null = null
    let attachment_type: string | null = null

    if (file && file.size > 0) {
      try {
        const uploaded = await uploadQaAttachment(supabase, user.id, file)
        attachment_url = uploaded.url
        attachment_type = uploaded.type
      } catch (err) {
        throw new ApiError(400, err instanceof Error ? err.message : 'Failed to upload attachment')
      }
    }

    const { data: question, error } = await supabase
      .from('qa_questions')
      .insert({ user_id: user.id, subject, title, body: body || null, attachment_url, attachment_type })
      .select()
      .single()

    if (error || !question) throw new ApiError(400, error?.message ?? 'Failed to post question')

    return NextResponse.json({ question })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error posting question' }, { status: 500 })
  }
}
