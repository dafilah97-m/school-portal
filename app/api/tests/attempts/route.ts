import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { requireUser } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireUser()
    const { testId } = await request.json()
    if (!testId) throw new ApiError(400, 'testId is required')

    const supabase = await createClient()

    const { data: test } = await supabase
      .from('tests')
      .select('id, title, duration_minutes, status')
      .eq('id', testId)
      .eq('status', 'published')
      .single()

    if (!test) throw new ApiError(404, 'Test not found')

    const { data: questions, error: questionsError } = await supabase
      .from('test_questions_public')
      .select('*')
      .eq('test_id', testId)
      .order('order_index', { ascending: true })

    if (questionsError || !questions || questions.length === 0) {
      throw new ApiError(400, 'This test has no questions')
    }

    const { data: attempt, error: attemptError } = await supabase
      .from('test_attempts')
      .insert({ test_id: testId, user_id: user.id, total_questions: questions.length })
      .select()
      .single()

    if (attemptError || !attempt) throw new ApiError(400, attemptError?.message ?? 'Failed to start attempt')

    return NextResponse.json({ attempt, test, questions })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error starting test' }, { status: 500 })
  }
}
