import AskQuestionForm from '@/components/qa/AskQuestionForm'

export default function NewQuestionPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-xl font-bold mb-6 text-primary">Ask a question</h1>
      <AskQuestionForm />
    </div>
  )
}
