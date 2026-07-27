import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import VideoRow from '@/components/admin/subjects/VideoRow'
import { Button } from '@/components/ui/button'
import type { EducationalVideo } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function SubjectVideosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: videos } = await supabase
    .from('educational_videos')
    .select('*')
    .eq('created_by', user?.id ?? '')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">My videos</h1>
        <Link href="/admin/subjects/videos/new">
          <Button size="sm">Add video</Button>
        </Link>
      </div>

      <div className="border rounded-xl divide-y">
        {!videos || videos.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No videos added yet.</p>
        ) : (
          (videos as EducationalVideo[]).map((video) => <VideoRow key={video.id} video={video} />)
        )}
      </div>
    </div>
  )
}
