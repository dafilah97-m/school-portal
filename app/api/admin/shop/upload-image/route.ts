import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@/lib/supabase-server'
import { requireRole } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  try {
    await requireRole('shop_admin', 'super_admin')

    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) throw new ApiError(400, 'No file provided')

    const ext = file.name.split('.').pop() ?? 'jpg'
    const filename = `${uuidv4()}.${ext}`
    const bytes = Buffer.from(await file.arrayBuffer())

    const supabase = await createClient()
    const { error } = await supabase.storage
      .from('public-images')
      .upload(filename, bytes, { contentType: file.type, upsert: false })

    if (error) throw new ApiError(400, error.message)

    const {
      data: { publicUrl },
    } = supabase.storage.from('public-images').getPublicUrl(filename)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error uploading image' }, { status: 500 })
  }
}
