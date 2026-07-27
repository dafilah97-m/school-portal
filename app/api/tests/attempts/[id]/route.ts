import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'
import { requireUser } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'

export async function GET(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireUser()
    const { id } = await segmentData.params

    const supabase = await createClient()
    const { data: attempt } = await supabase
      .from('test_attempts')
      .select('*, tests(title)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!attempt) throw new ApiError(404, 'Attempt not found')
    if (!attempt.submitted_at) throw new ApiError(400, 'This attempt has not been submitted yet')

    // Revealing correct answers is fine post-submission, but students have
    // no select policy on test_questions itself — service-role reads it.
    const serviceClient = await createServiceClient()
    const [{ data: questions }, { data: answers }] = await Promise.all([
      serviceClient
        .from('test_questions')
        .select('*')
        .eq('test_id', attempt.test_id)
        .order('order_index', { ascending: true }),
      serviceClient.from('test_attempt_answers').select('*').eq('attempt_id', id),
    ])

    const answerByQuestion = new Map((answers ?? []).map((a) => [a.question_id, a]))

    const review = (questions ?? []).map((q) => {
      const answer = answerByQuestion.get(q.id)
      return {
        questionId: q.id,
        questionText: q.question_text,
        options: q.options,
        correctOptionIndex: q.correct_option_index,
        selectedOptionIndex: answer?.selected_option_index ?? null,
        isCorrect: answer?.is_correct ?? false,
      }
    })

    return NextResponse.json({ attempt, review })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error loading attempt' }, { status: 500 })
  }
}
