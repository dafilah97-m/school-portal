import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Button } from '@/components/ui/button'
import type { QaQuestion } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function QaListPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>
}) {
  const { subject } = await searchParams
  const supabase = await createClient()

  let query = supabase.from('qa_questions').select('*').order('created_at', { ascending: false })
  if (subject) query = query.eq('subject', subject)
  const { data: questions } = await query

  const userIds = [...new Set((questions ?? []).map((q) => q.user_id))]
  const { data: authors } = userIds.length
    ? await supabase.from('profiles_public').select('*').in('id', userIds)
    : { data: [] as { id: string; full_name: string | null }[] }
  const authorMap = new Map((authors ?? []).map((a) => [a.id, a.full_name]))

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-primary">Ask & Answer</h1>
        <Link href="/qa/new">
          <Button size="sm">Ask a question</Button>
        </Link>
      </div>
      <p className="text-muted-foreground mb-6 text-sm">
        Ask teachers or other students a question — attach a PDF or image if it helps.
      </p>

      <form className="flex gap-3 mb-6" method="get">
        <input
          name="subject"
          defaultValue={subject}
          placeholder="Filter by subject"
          className="border border-border bg-card rounded-lg px-3 py-1.5 text-sm"
        />
        <button type="submit" className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm">
          Filter
        </button>
      </form>

      {!questions || questions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No questions yet — be the first to ask.</p>
      ) : (
        <div className="space-y-3">
          {(questions as QaQuestion[]).map((q) => (
            <Link key={q.id} href={`/qa/${q.id}`} className="block border rounded-xl p-4 hover:shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-1">
                <p className="font-medium">{q.title}</p>
                <span className="text-xs text-muted-foreground shrink-0">{q.subject}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {authorMap.get(q.user_id) || 'Someone'} · {new Date(q.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
