'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Test, TestQuestion } from '@/lib/types'

interface QuestionDraft {
  question_text: string
  options: string[]
  correct_option_index: number
}

function emptyQuestion(): QuestionDraft {
  return { question_text: '', options: ['', ''], correct_option_index: 0 }
}

export default function TestForm({
  test,
  initialQuestions,
}: {
  test?: Test
  initialQuestions?: TestQuestion[]
}) {
  const router = useRouter()
  const [title, setTitle] = useState(test?.title ?? '')
  const [subject, setSubject] = useState(test?.subject ?? '')
  const [gradeLevel, setGradeLevel] = useState(test?.grade_level ?? '')
  const [durationMinutes, setDurationMinutes] = useState(test?.duration_minutes?.toString() ?? '30')
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    initialQuestions && initialQuestions.length > 0
      ? initialQuestions.map((q) => ({
          question_text: q.question_text,
          options: q.options,
          correct_option_index: q.correct_option_index,
        }))
      : [emptyQuestion()]
  )
  const [submitting, setSubmitting] = useState(false)

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)))
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) } : q
      )
    )
  }

  function addOption(qIndex: number) {
    setQuestions((qs) =>
      qs.map((q, i) => (i === qIndex && q.options.length < 4 ? { ...q, options: [...q.options, ''] } : q))
    )
  }

  function removeOption(qIndex: number, oIndex: number) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIndex || q.options.length <= 2) return q
        const options = q.options.filter((_, j) => j !== oIndex)
        const correct_option_index = q.correct_option_index >= options.length ? 0 : q.correct_option_index
        return { ...q, options, correct_option_index }
      })
    )
  }

  function addQuestion() {
    setQuestions((qs) => [...qs, emptyQuestion()])
  }

  function removeQuestion(index: number) {
    setQuestions((qs) => (qs.length > 1 ? qs.filter((_, i) => i !== index) : qs))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    for (const q of questions) {
      if (!q.question_text.trim() || q.options.some((o) => !o.trim())) {
        toast.error('Fill in every question and option before saving')
        return
      }
    }

    setSubmitting(true)

    const url = test ? `/api/tests/update/${test.id}` : '/api/tests'
    const method = test ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        subject,
        grade_level: gradeLevel,
        duration_minutes: Number(durationMinutes),
        questions,
      }),
    })

    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Failed to save test')
      return
    }

    toast.success(test ? 'Test updated' : 'Test saved as draft — submit it for approval from your list')
    router.push('/admin/subjects/tests')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="border rounded-xl p-4 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="grade_level">Grade level</Label>
            <Input id="grade_level" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="border rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-1.5">
                <Label>Question {qIndex + 1}</Label>
                <Input
                  value={q.question_text}
                  onChange={(e) => updateQuestion(qIndex, { question_text: e.target.value })}
                  required
                />
              </div>
              {questions.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="mt-6"
                  onClick={() => removeQuestion(qIndex)}
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {q.options.map((option, oIndex) => (
                <div key={oIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${qIndex}`}
                    checked={q.correct_option_index === oIndex}
                    onChange={() => updateQuestion(qIndex, { correct_option_index: oIndex })}
                  />
                  <Input
                    value={option}
                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    placeholder={`Option ${oIndex + 1}`}
                    required
                  />
                  {q.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(qIndex, oIndex)}
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {q.options.length < 4 && (
                <button
                  type="button"
                  onClick={() => addOption(qIndex)}
                  className="text-xs text-gray-500 underline"
                >
                  + Add option
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer.</p>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addQuestion} className="w-full">
          <Plus size={14} />
          Add question
        </Button>
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {test ? 'Save changes' : 'Save test as draft'}
      </Button>
    </form>
  )
}
