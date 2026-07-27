import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Attachment from '@/components/qa/Attachment'
import ReplyForm from '@/components/qa/ReplyForm'
import type { QaAnswer, QaQuestion } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: question } = await supabase.from('qa_questions').select('*').eq('id', id).single()
  if (!question) notFound()

  const { data: answers } = await supabase
    .from('qa_answers')
    .select('*')
    .eq('question_id', id)
    .order('created_at', { ascending: true })

  const userIds = [...new Set([question.user_id, ...(answers ?? []).map((a) => a.user_id)])]
  const { data: authors } = await supabase.from('profiles_public').select('*').in('id', userIds)
  const authorMap = new Map((authors ?? []).map((a) => [a.id, a.full_name]))

  const q = question as QaQuestion

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="border rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h1 className="text-xl font-bold text-primary">{q.title}</h1>
          <span className="text-xs text-muted-foreground shrink-0">{q.subject}</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {authorMap.get(q.user_id) || 'Someone'} · {new Date(q.created_at).toLocaleDateString()}
        </p>
        {q.body && <p className="text-sm whitespace-pre-line">{q.body}</p>}
        {q.attachment_url && <Attachment url={q.attachment_url} type={q.attachment_type} />}
      </div>

      <h2 className="text-sm font-semibold text-muted-foreground mb-3">
        {(answers ?? []).length} {(answers ?? []).length === 1 ? 'reply' : 'replies'}
      </h2>

      <div className="space-y-3 mb-6">
        {((answers ?? []) as QaAnswer[]).map((a) => (
          <div key={a.id} className="border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-2">
              {authorMap.get(a.user_id) || 'Someone'} · {new Date(a.created_at).toLocaleDateString()}
            </p>
            {a.body && <p className="text-sm whitespace-pre-line">{a.body}</p>}
            {a.attachment_url && <Attachment url={a.attachment_url} type={a.attachment_type} />}
          </div>
        ))}
      </div>

      <ReplyForm questionId={id} />
    </div>
  )
}
