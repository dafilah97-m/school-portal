import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { requireRole, assertSubjectMatch } from '@/lib/require-role'
import { ApiError } from '@/lib/api-error'

interface QuestionInput {
  question_text: string
  options: string[]
  correct_option_index: number
}

function validateQuestions(questions: unknown): QuestionInput[] {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new ApiError(400, 'At least one question is required')
  }
  return (questions as Record<string, unknown>[]).map((q, i) => {
    if (!q.question_text || !Array.isArray(q.options) || q.options.length < 2) {
      throw new ApiError(400, `Question ${i + 1} needs text and at least 2 options`)
    }
    if (
      typeof q.correct_option_index !== 'number' ||
      q.correct_option_index < 0 ||
      q.correct_option_index >= q.options.length
    ) {
      throw new ApiError(400, `Question ${i + 1} needs a valid correct answer`)
    }
    return {
      question_text: q.question_text as string,
      options: q.options as string[],
      correct_option_index: q.correct_option_index as number,
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const { user, role, assignedSubject } = await requireRole('subject_admin', 'super_admin')
    const body = await request.json()
    const { title, subject, grade_level, duration_minutes } = body

    if (!title || !subject || !duration_minutes) {
      throw new ApiError(400, 'title, subject, and duration_minutes are required')
    }
    assertSubjectMatch(role, assignedSubject, subject)
    const questions = validateQuestions(body.questions)

    const supabase = await createClient()

    const { data: test, error: testError } = await supabase
      .from('tests')
      .insert({
        title,
        subject,
        grade_level: grade_level || null,
        duration_minutes: Number(duration_minutes),
        status: 'draft',
        created_by: user.id,
      })
      .select()
      .single()

    if (testError || !test) throw new ApiError(400, testError?.message ?? 'Failed to create test')

    const { error: questionsError } = await supabase.from('test_questions').insert(
      questions.map((q, i) => ({
        test_id: test.id,
        question_text: q.question_text,
        options: q.options,
        correct_option_index: q.correct_option_index,
        order_index: i,
      }))
    )

    if (questionsError) {
      await supabase.from('tests').delete().eq('id', test.id)
      throw new ApiError(400, questionsError.message)
    }

    return NextResponse.json({ test })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error creating test' }, { status: 500 })
  }
}
