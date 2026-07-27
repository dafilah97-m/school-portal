'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TestQuestionPublic } from '@/lib/types'

interface ReviewItem {
  questionId: string
  questionText: string
  options: string[]
  correctOptionIndex: number
  selectedOptionIndex: number | null
  isCorrect: boolean
}

export default function TakeTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: testId } = use(params)

  const [loading, setLoading] = useState(true)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [testTitle, setTestTitle] = useState('')
  const [questions, setQuestions] = useState<TestQuestionPublic[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number; totalQuestions: number; review: ReviewItem[] } | null>(
    null
  )
  const submittedRef = useRef(false)
  const answersRef = useRef(answers)
  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  const submit = useCallback(
    async (currentAnswers: Record<string, number>) => {
      if (submittedRef.current || !attemptId) return
      submittedRef.current = true
      setSubmitting(true)

      const res = await fetch(`/api/tests/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: Object.entries(currentAnswers).map(([questionId, selectedOptionIndex]) => ({
            questionId,
            selectedOptionIndex,
          })),
        }),
      })

      setSubmitting(false)
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to submit test')
        submittedRef.current = false
        return
      }

      setResult(await res.json())
    },
    [attemptId]
  )

  useEffect(() => {
    let cancelled = false

    async function start() {
      const res = await fetch('/api/tests/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Could not start this test')
        setLoading(false)
        return
      }
      if (cancelled) return

      setAttemptId(data.attempt.id)
      setTestTitle(data.test.title)
      setQuestions(data.questions)
      setSecondsLeft(data.test.duration_minutes * 60)
      setLoading(false)
    }

    start()
    return () => {
      cancelled = true
    }
  }, [testId])

  useEffect(() => {
    if (loading || result || secondsLeft <= 0) return
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval)
          submit(answersRef.current)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, result])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-sm text-muted-foreground">
        Loading test...
      </div>
    )
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-2 text-primary">{testTitle} — Result</h1>
        <p className="text-lg font-semibold mb-6">
          You scored {result.score} / {result.totalQuestions}
        </p>
        <div className="space-y-4">
          {result.review.map((item, i) => (
            <div key={item.questionId} className="border rounded-xl p-4">
              <p className="font-medium mb-2">
                {i + 1}. {item.questionText}
              </p>
              <div className="space-y-1.5">
                {item.options.map((option, oi) => {
                  const isSelected = item.selectedOptionIndex === oi
                  const isCorrectOption = item.correctOptionIndex === oi
                  return (
                    <div
                      key={oi}
                      className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${
                        isCorrectOption
                          ? 'bg-green-50 text-green-700'
                          : isSelected
                            ? 'bg-red-50 text-red-700'
                            : ''
                      }`}
                    >
                      {isCorrectOption ? (
                        <CheckCircle2 size={14} />
                      ) : isSelected ? (
                        <XCircle size={14} />
                      ) : (
                        <span className="w-3.5" />
                      )}
                      {option}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <Link href="/dashboard">
          <Button className="mt-6">Back to dashboard</Button>
        </Link>
      </div>
    )
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6 sticky top-16 bg-background py-2 z-10">
        <h1 className="text-xl font-bold text-primary">{testTitle}</h1>
        <span className="font-mono text-lg font-semibold tabular-nums">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={q.id} className="border rounded-xl p-4">
            <p className="font-medium mb-3">
              {i + 1}. {q.question_text}
            </p>
            <div className="space-y-2">
              {q.options.map((option, oi) => (
                <label key={oi} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === oi}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button onClick={() => submit(answers)} disabled={submitting} className="w-full mt-6">
        {submitting && <Loader2 size={16} className="animate-spin mr-2" />}
        Submit test
      </Button>
    </div>
  )
}
