import { createClient } from '@/lib/supabase-server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ApprovalQueueCard from '@/components/admin/ApprovalQueueCard'
import type { EduResource, EducationalVideo, NewsEvent } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ApprovalsPage() {
  const supabase = await createClient()

  const [{ data: resources }, { data: videos }, { data: posts }] = await Promise.all([
    supabase
      .from('edu_resources')
      .select('*')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: true }),
    supabase
      .from('educational_videos')
      .select('*')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: true }),
    supabase
      .from('news_events')
      .select('*')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: true }),
  ])

  const resourceRows = (resources ?? []) as EduResource[]
  const videoRows = (videos ?? []) as EducationalVideo[]
  const postRows = (posts ?? []) as NewsEvent[]

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Pending approvals</h1>

      <Tabs defaultValue="papers">
        <TabsList>
          <TabsTrigger value="papers">Past papers ({resourceRows.length})</TabsTrigger>
          <TabsTrigger value="videos">Videos ({videoRows.length})</TabsTrigger>
          <TabsTrigger value="news">News & Events ({postRows.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="papers" className="space-y-3 mt-4">
          {resourceRows.length === 0 ? (
            <p className="text-sm text-gray-500">Nothing waiting for review.</p>
          ) : (
            resourceRows.map((resource) => (
              <ApprovalQueueCard
                key={resource.id}
                title={resource.title}
                subtitle={`${resource.subject}${resource.grade_level ? ` · ${resource.grade_level}` : ''}${resource.year ? ` · ${resource.year}` : ''} · P${resource.price.toFixed(2)}`}
                approveEndpoint={`/api/edu-vault/approve/${resource.id}`}
                rejectEndpoint={`/api/edu-vault/reject/${resource.id}`}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="videos" className="space-y-3 mt-4">
          {videoRows.length === 0 ? (
            <p className="text-sm text-gray-500">Nothing waiting for review.</p>
          ) : (
            videoRows.map((video) => (
              <ApprovalQueueCard
                key={video.id}
                title={video.title}
                subtitle={video.subject || 'General'}
                approveEndpoint={`/api/videos/approve/${video.id}`}
                rejectEndpoint={`/api/videos/reject/${video.id}`}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="news" className="space-y-3 mt-4">
          {postRows.length === 0 ? (
            <p className="text-sm text-gray-500">Nothing waiting for review.</p>
          ) : (
            postRows.map((post) => (
              <ApprovalQueueCard
                key={post.id}
                title={post.title}
                subtitle={post.event_date ? new Date(post.event_date).toLocaleDateString() : 'News post'}
                approveEndpoint={`/api/news/approve/${post.id}`}
                rejectEndpoint={`/api/news/reject/${post.id}`}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
