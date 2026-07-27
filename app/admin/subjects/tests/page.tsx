import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import TestRow from '@/components/admin/subjects/TestRow'
import { Button } from '@/components/ui/button'
import type { Test } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function SubjectTestsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: tests } = await supabase
    .from('tests')
    .select('*')
    .eq('created_by', user?.id ?? '')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">My practice tests</h1>
        <Link href="/admin/subjects/tests/new">
          <Button size="sm">New test</Button>
        </Link>
      </div>

      <div className="border rounded-xl divide-y">
        {!tests || tests.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No tests created yet.</p>
        ) : (
          (tests as Test[]).map((test) => <TestRow key={test.id} test={test} />)
        )}
      </div>
    </div>
  )
}
