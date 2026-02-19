import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArticleList } from '@/components/cms/ArticleList'

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const status = searchParams.status || 'all'
  const page = parseInt(searchParams.page || '1', 10)
  const limit = 20
  const offset = (page - 1) * limit

  let query = supabase
    .from('blog_articles')
    .select('id, slug, title, meta_description, category, status, published_at, created_at, word_count, review, tags, retry_count', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: articles, count } = await query
  const totalPages = Math.ceil((count || 0) / limit)

  // Get counts per status
  const { count: draftCount } = await supabase.from('blog_articles').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'draft')
  const { count: reviewCount } = await supabase.from('blog_articles').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'review')
  const { count: publishedCount } = await supabase.from('blog_articles').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'published')
  const { count: rejectedCount } = await supabase.from('blog_articles').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'rejected')

  const statuses = [
    { key: 'all', label: 'All', count: count || 0 },
    { key: 'draft', label: 'Draft', count: draftCount || 0 },
    { key: 'review', label: 'In Review', count: reviewCount || 0 },
    { key: 'published', label: 'Published', count: publishedCount || 0 },
    { key: 'rejected', label: 'Rejected', count: rejectedCount || 0 },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Articles</h1>
        <Link
          href="/dashboard/articles/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          New Article
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {statuses.map(s => (
          <Link
            key={s.key}
            href={`/dashboard/articles?status=${s.key}`}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              status === s.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {s.label}
            <span className="ml-1.5 text-xs text-gray-400">({s.count})</span>
          </Link>
        ))}
      </div>

      <ArticleList articles={articles || []} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-8">
          {page > 1 && (
            <Link
              href={`/dashboard/articles?status=${status}&page=${page - 1}`}
              className="px-3 py-1.5 rounded bg-gray-100 text-sm hover:bg-gray-200"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link
              href={`/dashboard/articles?status=${status}&page=${page + 1}`}
              className="px-3 py-1.5 rounded bg-gray-100 text-sm hover:bg-gray-200"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
