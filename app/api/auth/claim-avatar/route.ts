import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { ApiError } from '@/lib/api-error'

// Called right after signUp(), before the user has a session (email
// confirmation is still pending), so this can't go through the normal
// RLS-scoped storage upload — it uses the service-role client instead.
// To keep this from being an open write, it requires the userId+email
// pair to match the just-created row AND only ever claims an avatar
// once (avatar_url must currently be null); it can't be used to
// overwrite an existing avatar without a real session.
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const userId = form.get('userId') as string | null
    const email = form.get('email') as string | null
    const file = form.get('file') as File | null

    if (!userId || !email || !file) {
      throw new ApiError(400, 'userId, email, and file are required')
    }
    if (!file.type.startsWith('image/')) {
      throw new ApiError(400, 'Only image files are accepted')
    }

    const supabase = await createServiceClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, avatar_url')
      .eq('id', userId)
      .single()

    if (!profile || profile.email.toLowerCase() !== email.toLowerCase()) {
      throw new ApiError(403, 'Could not verify this account')
    }
    if (profile.avatar_url) {
      throw new ApiError(400, 'An avatar has already been set for this account')
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${userId}/avatar.${ext}`
    const bytes = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, bytes, { contentType: file.type, upsert: true })

    if (uploadError) throw new ApiError(500, uploadError.message)

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(path)

    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)

    return NextResponse.json({ avatarUrl: publicUrl })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error uploading avatar' }, { status: 500 })
  }
}
