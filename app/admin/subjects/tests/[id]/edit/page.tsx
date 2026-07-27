import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import TestForm from '@/components/admin/subjects/TestForm'
import type { Test, TestQuestion } from '@/lib/types'

export default async function EditTestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: test } = await supabase.from('tests').select('*').eq('id', id).single()
  if (!test) notFound()

  const { data: questions } = await supabase
    .from('test_questions')
    .select('*')
    .eq('test_id', id)
    .order('order_index', { ascending: true })

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Edit test</h1>
      <TestForm test={test as Test} initialQuestions={(questions as TestQuestion[]) ?? []} />
    </div>
  )
}
