import { v4 as uuidv4 } from 'uuid'
import type { SupabaseClient } from '@supabase/supabase-js'

// Shared by the qa_questions and qa_answers routes. Uploads via the
// caller's own session client — the qa-attachments storage RLS policy
// already lets any authenticated user write into their own {user_id}/
// folder, so no service-role bypass is needed here.
export async function uploadQaAttachment(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<{ url: string; type: 'pdf' | 'image' }> {
  const isImage = file.type.startsWith('image/')
  const isPdf = file.type === 'application/pdf'
  if (!isImage && !isPdf) {
    throw new Error('Only images or PDF files are accepted as attachments')
  }

  const ext = file.name.split('.').pop() || (isPdf ? 'pdf' : 'jpg')
  const path = `${userId}/${uuidv4()}.${ext}`
  const bytes = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from('qa-attachments')
    .upload(path, bytes, { contentType: file.type, upsert: false })

  if (error) throw new Error(error.message)

  const {
    data: { publicUrl },
  } = supabase.storage.from('qa-attachments').getPublicUrl(path)

  return { url: publicUrl, type: isPdf ? 'pdf' : 'image' }
}
