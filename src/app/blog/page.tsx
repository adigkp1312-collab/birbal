import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import type { Metadata } from 'next'
import { BlogCard } from '@/components/blog/BlogCard'

export const metadata: Metadata = {
  title: 'Birbal Blog — AI-Powered Insights & Trending Analysis',
  description: 'Discover AI-researched articles on trending topics. Auto-generated, fact-checked, and published with full source citations.',
}

export const revalidate = 3600 // ISR: revalidate every 1 hour

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

interface Article {
  id: string
  slug: string
  title: string
  meta_description: string
  category: string
  tags: string[]
  featured_image_url: string | null
  featured_image_alt: string | null
  author: string
  published_at: string
  word_count: number
}

export default async function BlogHomePage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const supabase = getSupabase()
  if (!supabase) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No articles yet</h2>
          <p className="text-gray-600">Check back soon — new content is being generated.</p>
        </div>
      </div>
    )
  }
  const page = parseInt(searchParams.page || '1', 10)
  const limit = 12
  const offset = (page - 1) * limit

  const { data: articles, count } = await supabase
    .from('blog_articles')
    .select('id, slug, title, meta_description, category, tags, featured_image_url, featured_image_alt, author, published_at, word_count', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const totalPages = Math.ceil((count || 0) / limit)
  const featuredArticle = articles?.[0]
  const remainingArticles = articles?.slice(1) || []

  // Get categories
  const { data: allArticles } = await supabase
    .from('blog_articles')
    .select('category')
    .eq('status', 'published')

  const categories = Array.from(new Set((allArticles || []).map(a => a.category).filter(Boolean)))

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero / Featured Article */}
      {featuredArticle && (
        <Link href={`/blog/${featuredArticle.slug}`} className="block mb-12">
          <article className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700 p-8 md:p-12 text-white hover:shadow-2xl transition-shadow">
            <div className="relative z-10">
              {featuredArticle.category && (
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-4">
                  {featuredArticle.category}
                </span>
              )}
              <h1 className="text-2xl md:text-4xl font-bold mb-3 group-hover:underline decoration-2 underline-offset-4">
                {featuredArticle.title}
              </h1>
              <p className="text-white/80 text-lg max-w-2xl mb-4">
                {featuredArticle.meta_description}
              </p>
              <div className="flex items-center space-x-4 text-sm text-white/60">
                <span>{featuredArticle.author}</span>
                <span>&middot;</span>
                <time dateTime={featuredArticle.published_at}>
                  {new Date(featuredArticle.published_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </time>
                <span>&middot;</span>
                <span>{Math.ceil(featuredArticle.word_count / 200)} min read</span>
              </div>
            </div>
          </article>
        </Link>
      )}

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/blog"
            className="px-4 py-2 rounded-full text-sm font-medium bg-gray-900 text-white"
          >
            All
          </Link>
          {categories.map(cat => (
            <Link
              key={cat}
              href={`/blog/category/${encodeURIComponent(cat)}`}
              className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>
      )}

      {/* Article Grid */}
      {remainingArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {remainingArticles.map((article: Article) => (
            <BlogCard key={article.id} article={article} />
          ))}
        </div>
      ) : !featuredArticle ? (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No articles yet</h2>
          <p className="text-gray-600">Check back soon — new content is being generated.</p>
        </div>
      ) : null}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-12">
          {page > 1 && (
            <Link
              href={`/blog?page=${page - 1}`}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/blog?page=${page + 1}`}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
