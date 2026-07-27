import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import NewsForm from '@/components/admin/subjects/NewsForm'
import type { NewsEvent } from '@/lib/types'

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: post } = await supabase.from('news_events').select('*').eq('id', id).single()

  if (!post) notFound()

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Edit post</h1>
      <NewsForm post={post as NewsEvent} />
    </div>
  )
}
