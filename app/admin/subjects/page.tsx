import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import ResourceRow from '@/components/admin/subjects/ResourceRow'
import { Button } from '@/components/ui/button'
import type { EduResource } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function SubjectResourcesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: resources } = await supabase
    .from('edu_resources')
    .select('*')
    .eq('created_by', user?.id ?? '')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">My resources</h1>
        <Link href="/admin/subjects/new">
          <Button size="sm">Upload new</Button>
        </Link>
      </div>

      <div className="border rounded-xl divide-y">
        {!resources || resources.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No resources uploaded yet.</p>
        ) : (
          (resources as EduResource[]).map((resource) => (
            <ResourceRow key={resource.id} resource={resource} />
          ))
        )}
      </div>
    </div>
  )
}
