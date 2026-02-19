import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TopicQueue } from '@/components/cms/TopicQueue'

export default async function TopicsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get pending topics (not expired)
  const { data: topics } = await supabase
    .from('trending_topics')
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .order('relevance_score', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Topic Queue</h1>
          <p className="text-sm text-gray-500 mt-1">
            Topics discovered by the AI agent. Higher relevance = generated first.
          </p>
        </div>
      </div>

      <TopicQueue topics={topics || []} />
    </div>
  )
}
