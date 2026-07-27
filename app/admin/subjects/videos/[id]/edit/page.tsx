import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import VideoForm from '@/components/admin/subjects/VideoForm'
import type { EducationalVideo } from '@/lib/types'

export default async function EditVideoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: video } = await supabase.from('educational_videos').select('*').eq('id', id).single()

  if (!video) notFound()

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Edit video</h1>
      <VideoForm video={video as EducationalVideo} />
    </div>
  )
}
