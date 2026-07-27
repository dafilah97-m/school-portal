import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase-public'
import VideoCard from '@/components/videos/VideoCard'
import type { EducationalVideo } from '@/lib/types'

export const revalidate = 60

export default async function Home() {
  const supabase = createPublicClient()
  const { data: videos } = await supabase
    .from('educational_videos')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <section className="text-center mb-14">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">
          School merchandise & exam papers, one checkout
        </h1>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
          Order class t-shirts for your school&apos;s active campaign, and grab
          exam-ready study packs — all in one cart.
        </p>
        <div className="flex items-center justify-center flex-wrap gap-3 mt-6">
          <Link
            href="/shop"
            className="inline-block px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Shop merchandise
          </Link>
          <Link
            href="/exams"
            className="inline-block px-5 py-2.5 rounded-lg bg-[#C9A227] text-[#0B2545] text-sm font-semibold hover:bg-[#DDBA45] transition-colors"
          >
            Browse Exams
          </Link>
          <Link
            href="/news-events"
            className="inline-block px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            News & Events
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4 text-primary">Educational videos</h2>
        {!videos || videos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No videos published yet — check back soon.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(videos as EducationalVideo[]).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
