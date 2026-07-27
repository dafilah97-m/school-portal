import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { requireRole } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole('subject_admin', 'super_admin')
    const form = await request.formData()

    const file = form.get('file') as File | null
    const title = form.get('title') as string | null
    const subject = form.get('subject') as string | null
    const gradeLevel = form.get('grade_level') as string | null
    const year = form.get('year') as string | null
    const price = form.get('price') as string | null

    if (!file) throw new ApiError(400, 'A PDF file is required')
    if (!title || !subject || !price) {
      throw new ApiError(400, 'title, subject, and price are required')
    }
    if (file.type !== 'application/pdf') throw new ApiError(400, 'Only PDF files are accepted')

    const supabase = await createClient()

    const { data: resource, error: insertError } = await supabase
      .from('edu_resources')
      .insert({
        title,
        subject,
        grade_level: gradeLevel || null,
        year: year ? Number(year) : null,
        price: Number(price),
        file_url: '',
        status: 'draft',
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError || !resource) {
      throw new ApiError(500, insertError?.message ?? 'Failed to create resource record')
    }

    const path = `${resource.id}/original.pdf`
    const bytes = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('private-resources')
      .upload(path, bytes, { contentType: 'application/pdf', upsert: true })

    if (uploadError) {
      await supabase.from('edu_resources').delete().eq('id', resource.id)
      throw new ApiError(500, uploadError.message)
    }

    await supabase.from('edu_resources').update({ file_url: path }).eq('id', resource.id)

    return NextResponse.json({ resource: { ...resource, file_url: path } })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error uploading resource' }, { status: 500 })
  }
}
