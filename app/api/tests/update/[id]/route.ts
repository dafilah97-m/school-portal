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

export async function PATCH(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const { user, role, assignedSubject } = await requireRole('subject_admin', 'super_admin')
    const { id } = await segmentData.params
    const body = await request.json()

    if (body.subject) assertSubjectMatch(role, assignedSubject, body.subject)

    const updates: Record<string, unknown> = {}
    if (body.title != null) updates.title = body.title
    if (body.subject != null) updates.subject = body.subject
    if (body.grade_level !== undefined) updates.grade_level = body.grade_level || null
    if (body.duration_minutes != null) updates.duration_minutes = Number(body.duration_minutes)

    const supabase = await createClient()

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('tests')
        .update(updates)
        .eq('id', id)
        .eq('created_by', user.id)

      if (error) throw new ApiError(404, 'Test not found or not editable')
    }

    if (body.questions) {
      const questions = validateQuestions(body.questions)

      const { error: deleteError } = await supabase.from('test_questions').delete().eq('test_id', id)
      if (deleteError) throw new ApiError(400, deleteError.message)

      const { error: insertError } = await supabase.from('test_questions').insert(
        questions.map((q, i) => ({
          test_id: id,
          question_text: q.question_text,
          options: q.options,
          correct_option_index: q.correct_option_index,
          order_index: i,
        }))
      )
      if (insertError) throw new ApiError(400, insertError.message)
    }

    const { data: test } = await supabase.from('tests').select('*').eq('id', id).single()

    return NextResponse.json({ test })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error updating test' }, { status: 500 })
  }
}
