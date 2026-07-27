import { createClient } from '@/lib/supabase-server'
import RoleSelect from '@/components/admin/RoleSelect'
import type { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Users & role assignments</h1>
      <div className="border rounded-xl divide-y">
        {(profiles as Profile[] | null)?.map((profile) => (
          <div key={profile.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">{profile.email}</p>
              <p className="text-xs text-gray-500">
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
            <RoleSelect
              userId={profile.id}
              currentRole={profile.role}
              currentAssignedSubject={profile.assigned_subject}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
