import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import NewsRow from '@/components/admin/subjects/NewsRow'
import { Button } from '@/components/ui/button'
import type { NewsEvent } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function SubjectNewsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: posts } = await supabase
    .from('news_events')
    .select('*')
    .eq('created_by', user?.id ?? '')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">My news & events</h1>
        <Link href="/admin/subjects/news/new">
          <Button size="sm">New post</Button>
        </Link>
      </div>

      <div className="border rounded-xl divide-y">
        {!posts || posts.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No posts yet.</p>
        ) : (
          (posts as NewsEvent[]).map((post) => <NewsRow key={post.id} post={post} />)
        )}
      </div>
    </div>
  )
}
