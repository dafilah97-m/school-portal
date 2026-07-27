import { createPublicClient } from '@/lib/supabase-public'
import ResourceCard from '@/components/edu-vault/ResourceCard'
import type { EduResourcePublic } from '@/lib/types'

export const revalidate = 60

export default async function ExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; grade_level?: string; year?: string }>
}) {
  const { subject, grade_level, year } = await searchParams
  const supabase = createPublicClient()

  let query = supabase.from('edu_resources_public').select('*').order('created_at', { ascending: false })
  if (subject) query = query.eq('subject', subject)
  if (grade_level) query = query.eq('grade_level', grade_level)
  if (year) query = query.eq('year', Number(year))

  const { data: resources } = await query

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2 text-primary">Exams</h1>
      <p className="text-muted-foreground mb-8">Past papers, answer keys, and revision study guides.</p>

      <form className="flex flex-wrap gap-3 mb-8" method="get">
        <input
          name="subject"
          defaultValue={subject}
          placeholder="Subject"
          className="border border-border bg-card rounded-lg px-3 py-1.5 text-sm"
        />
        <input
          name="grade_level"
          defaultValue={grade_level}
          placeholder="Grade level"
          className="border border-border bg-card rounded-lg px-3 py-1.5 text-sm"
        />
        <input
          name="year"
          defaultValue={year}
          placeholder="Year"
          className="border border-border bg-card rounded-lg px-3 py-1.5 text-sm w-24"
        />
        <button type="submit" className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors">
          Filter
        </button>
      </form>

      {!resources || resources.length === 0 ? (
        <p className="text-sm text-muted-foreground">No resources match those filters yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(resources as EduResourcePublic[]).map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  )
}
