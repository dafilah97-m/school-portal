import { createClient } from '@/lib/supabase-server'
import TeacherReviewCard from '@/components/admin/TeacherReviewCard'
import type { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function TeacherReviewPage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('occupation', 'teacher')
    .eq('teacher_review_status', 'pending')
    .order('created_at', { ascending: true })

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Teacher review</h1>
      {!profiles || profiles.length === 0 ? (
        <p className="text-sm text-gray-500">No teacher signups waiting for review.</p>
      ) : (
        <div className="space-y-3">
          {(profiles as Profile[]).map((profile) => (
            <TeacherReviewCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  )
}
