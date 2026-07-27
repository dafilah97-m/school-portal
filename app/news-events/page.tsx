import { createPublicClient } from '@/lib/supabase-public'
import type { NewsEvent } from '@/lib/types'

export const revalidate = 60

export default async function NewsEventsPage() {
  const supabase = createPublicClient()
  const { data: posts } = await supabase
    .from('news_events')
    .select('*')
    .eq('status', 'published')
    .order('event_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">News & Events</h1>
      <p className="text-gray-500 mb-8">Announcements and upcoming school events.</p>

      {!posts || posts.length === 0 ? (
        <p className="text-sm text-gray-500">Nothing posted yet — check back soon.</p>
      ) : (
        <div className="space-y-6">
          {(posts as NewsEvent[]).map((post) => (
            <article key={post.id} className="border rounded-xl p-5">
              <div className="flex items-center justify-between gap-4 mb-2">
                <h2 className="font-semibold">{post.title}</h2>
                {post.event_date && (
                  <span className="text-xs text-gray-500 shrink-0">
                    {new Date(post.event_date).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-line">{post.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
