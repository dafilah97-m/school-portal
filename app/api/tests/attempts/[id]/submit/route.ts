import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'
import { requireUser } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'

interface AnswerInput {
  questionId: string
  selectedOptionIndex: number | null
}

export async function POST(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireUser()
    const { id } = await segmentData.params
    const { answers } = (await request.json()) as { answers: AnswerInput[] }

    const supabase = await createClient()
    const { data: attempt } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!attempt) throw new ApiError(404, 'Attempt not found')
    if (attempt.submitted_at) throw new ApiError(400, 'This attempt was already submitted')

    // Grading needs the real correct_option_index, which students have no
    // select policy for — only the service-role client can read it.
    const serviceClient = await createServiceClient()
    const { data: questions } = await serviceClient
      .from('test_questions')
      .select('*')
      .eq('test_id', attempt.test_id)
      .order('order_index', { ascending: true })

    if (!questions) throw new ApiError(500, 'Could not load questions for grading')

    const answerMap = new Map((answers ?? []).map((a) => [a.questionId, a.selectedOptionIndex]))

    let score = 0
    const gradedAnswers = questions.map((q) => {
      const selected = answerMap.get(q.id) ?? null
      const isCorrect = selected !== null && selected === q.correct_option_index
      if (isCorrect) score += 1
      return {
        attempt_id: id,
        question_id: q.id,
        selected_option_index: selected,
        is_correct: isCorrect,
      }
    })

    await serviceClient.from('test_attempt_answers').insert(gradedAnswers)
    await serviceClient
      .from('test_attempts')
      .update({ submitted_at: new Date().toISOString(), score })
      .eq('id', id)

    const review = questions.map((q) => {
      const graded = gradedAnswers.find((g) => g.question_id === q.id)
      return {
        questionId: q.id,
        questionText: q.question_text,
        options: q.options,
        correctOptionIndex: q.correct_option_index,
        selectedOptionIndex: graded?.selected_option_index ?? null,
        isCorrect: graded?.is_correct ?? false,
      }
    })

    return NextResponse.json({ score, totalQuestions: questions.length, review })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error submitting attempt' }, { status: 500 })
  }
}
