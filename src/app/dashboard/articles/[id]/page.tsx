import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ArticleEditor } from '@/components/cms/ArticleEditor'
import { ReviewPanel } from '@/components/cms/ReviewPanel'

export default async function EditArticlePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Handle "new" article
  if (params.id === 'new') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">New Article</h1>
        <ArticleEditor article={null} />
      </div>
    )
  }

  const { data: article, error } = await supabase
    .from('blog_articles')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !article) notFound()

  // Get reviews for this article
  const { data: reviews } = await supabase
    .from('article_reviews')
    .select('*')
    .eq('article_id', article.id)
    .order('reviewed_at', { ascending: false })
    .limit(1)

  const latestReview = reviews?.[0] || null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Edit Article</h1>
          <p className="text-sm text-gray-500 mt-1">/blog/{article.slug}</p>
        </div>
        <div className="flex items-center space-x-3">
          {article.status === 'published' && (
            <a
              href={`/blog/${article.slug}`}
              target="_blank"
              className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
            >
              View Live
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2">
          <ArticleEditor article={article} />
        </div>

        {/* Sidebar: Review + Meta */}
        <div className="space-y-6">
          <ReviewPanel review={article.review || latestReview} />

          {/* Generation Metadata */}
          {article.generation_metadata && (
            <div className="border rounded-xl p-4 text-sm">
              <h3 className="font-bold mb-2">Generation Info</h3>
              <dl className="space-y-1 text-gray-500">
                <div className="flex justify-between">
                  <dt>Model</dt>
                  <dd className="font-mono text-xs">{article.generation_metadata.model || 'unknown'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Grounding</dt>
                  <dd>{article.generation_metadata.grounding ? 'Yes' : 'No'}</dd>
                </div>
                {article.generation_metadata.regenerated && (
                  <div className="flex justify-between">
                    <dt>Regenerated</dt>
                    <dd>Yes (after review feedback)</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Citations */}
          {article.citations && article.citations.length > 0 && (
            <div className="border rounded-xl p-4 text-sm">
              <h3 className="font-bold mb-2">Sources ({article.citations.length})</h3>
              <ul className="space-y-1">
                {article.citations.slice(0, 10).map((c: any, i: number) => (
                  <li key={i} className="truncate">
                    <a href={c.url} target="_blank" className="text-blue-600 hover:underline text-xs">
                      {c.title || c.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
