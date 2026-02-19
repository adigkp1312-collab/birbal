import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import type { Metadata } from 'next'
import { BlogCard } from '@/components/blog/BlogCard'

export const revalidate = 3600

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

export async function generateMetadata({
  params,
}: {
  params: { category: string }
}): Promise<Metadata> {
  const category = decodeURIComponent(params.category)
  return {
    title: `${category} Articles`,
    description: `Browse all ${category} articles — AI-researched and fact-checked.`,
  }
}

export async function generateStaticParams() {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('blog_articles')
    .select('category')
    .eq('status', 'published')

  const categories = Array.from(new Set((data || []).map(a => a.category).filter(Boolean)))
  return categories.map(category => ({ category: encodeURIComponent(category) }))
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { category: string }
  searchParams: { page?: string }
}) {
  const supabase = getSupabase()
  const category = decodeURIComponent(params.category)
  const page = parseInt(searchParams.page || '1', 10)
  const limit = 12
  const offset = (page - 1) * limit

  const { data: articles, count } = await supabase
    .from('blog_articles')
    .select('id, slug, title, meta_description, category, tags, featured_image_url, featured_image_alt, author, published_at, word_count', { count: 'exact' })
    .eq('status', 'published')
    .eq('category', category)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const totalPages = Math.ceil((count || 0) / limit)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/blog" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
          &larr; All Posts
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{category}</h1>
        <p className="text-gray-600 mt-2">{count || 0} articles</p>
      </div>

      {articles && articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article: any) => (
            <BlogCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <h2 className="text-xl text-gray-600">No articles in this category yet.</h2>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-12">
          {page > 1 && (
            <Link
              href={`/blog/category/${encodeURIComponent(category)}?page=${page - 1}`}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link
              href={`/blog/category/${encodeURIComponent(category)}?page=${page + 1}`}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
