import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import EditResourceForm from '@/components/admin/subjects/EditResourceForm'
import type { EduResource } from '@/lib/types'

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: resource } = await supabase.from('edu_resources').select('*').eq('id', id).single()

  if (!resource) notFound()

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Edit resource</h1>
      <EditResourceForm resource={resource as EduResource} />
    </div>
  )
}
