import Link from 'next/link'
import { BookOpen, HeartPulse, TrendingUp, GraduationCap } from 'lucide-react'
import { createPublicClient } from '@/lib/supabase-public'
import VideoCard from '@/components/videos/VideoCard'
import InfoCard from '@/components/InfoCard'
import CareerPathCard from '@/components/CareerPathCard'
import { revisionTips, healthTips, whyItMatters, careerPaths } from '@/lib/landing-content'
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

      <section className="mb-14">
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

      <section className="mb-14">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={20} className="text-[#C9A227]" />
          <h2 className="text-lg font-semibold text-primary">Revision tips</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {revisionTips.map((tip) => (
            <InfoCard key={tip.title} icon={BookOpen} title={tip.title} description={tip.description} />
          ))}
        </div>
      </section>

      <section className="mb-14">
        <div className="flex items-center gap-2 mb-4">
          <HeartPulse size={20} className="text-[#C9A227]" />
          <h2 className="text-lg font-semibold text-primary">Health tips</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {healthTips.map((tip) => (
            <InfoCard key={tip.title} icon={HeartPulse} title={tip.title} description={tip.description} />
          ))}
        </div>
      </section>

      <section className="mb-14">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-[#C9A227]" />
          <h2 className="text-lg font-semibold text-primary">Why performing well in school matters</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {whyItMatters.map((tip) => (
            <InfoCard key={tip.title} icon={TrendingUp} title={tip.title} description={tip.description} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap size={20} className="text-[#C9A227]" />
          <h2 className="text-lg font-semibold text-primary">Tertiary courses & career paths</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          A general guide to which high school subjects support which career paths — always check the
          specific entry requirements of the tertiary institution and program you&apos;re aiming for.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {careerPaths.map((path) => (
            <CareerPathCard key={path.field} path={path} />
          ))}
        </div>
      </section>
    </div>
  )
}
