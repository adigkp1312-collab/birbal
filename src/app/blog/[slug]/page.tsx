import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BlogPost } from '@/components/blog/BlogPost'
import { StructuredData } from '@/components/blog/StructuredData'
import { RelatedPosts } from '@/components/blog/RelatedPosts'

export const revalidate = 3600 // ISR: 1 hour

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// Generate static params for all published articles
export async function generateStaticParams() {
  const supabase = getSupabase()
  if (!supabase) return []
  const { data } = await supabase
    .from('blog_articles')
    .select('slug')
    .eq('status', 'published')
    .limit(100)

  return (data || []).map(article => ({ slug: article.slug }))
}

// Dynamic metadata per article
export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const supabase = getSupabase()
  if (!supabase) return { title: 'Article Not Found' }
  const { data: article } = await supabase
    .from('blog_articles')
    .select('title, meta_description, seo, featured_image_url, published_at, author, slug')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (!article) return { title: 'Article Not Found' }

  const ogImage = article.featured_image_url || article.seo?.og_image
  const canonicalUrl = article.seo?.canonical_url || `/blog/${article.slug}`

  return {
    title: article.title,
    description: article.meta_description,
    authors: [{ name: article.author }],
    openGraph: {
      title: article.seo?.og_title || article.title,
      description: article.seo?.og_description || article.meta_description,
      type: 'article',
      publishedTime: article.published_at,
      authors: [article.author],
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.meta_description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = getSupabase()
  if (!supabase) notFound()

  const { data: article, error } = await supabase
    .from('blog_articles')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (error || !article) notFound()

  // Find related articles via vector similarity
  let relatedArticles: any[] = []
  if (article.embedding) {
    try {
      const { data: related } = await supabase.rpc('match_articles', {
        query_embedding: article.embedding,
        match_threshold: 0.4,
        match_count: 4,
      })
      // Filter out current article
      relatedArticles = (related || []).filter((a: any) => a.slug !== article.slug).slice(0, 3)
    } catch {
      // Vector search may fail if not enough articles — ignore
    }
  }

  const readingTime = Math.ceil(article.word_count / 200)

  return (
    <>
      <StructuredData article={article} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 mb-6">
          <a href="/blog" className="hover:text-gray-700">Blog</a>
          {article.category && (
            <>
              <span className="mx-2">/</span>
              <a href={`/blog/category/${encodeURIComponent(article.category)}`} className="hover:text-gray-700">
                {article.category}
              </a>
            </>
          )}
        </nav>

        {/* Article Header */}
        <header className="mb-8">
          {article.category && (
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mb-4">
              {article.category}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {article.h1 || article.title}
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="font-medium text-gray-700">{article.author}</span>
            <span>&middot;</span>
            <time dateTime={article.published_at}>
              {new Date(article.published_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </time>
            <span>&middot;</span>
            <span>{readingTime} min read</span>
            <span>&middot;</span>
            <span>{article.word_count.toLocaleString()} words</span>
          </div>
        </header>

        {/* Featured Image */}
        {article.featured_image_url && (
          <figure className="mb-8 rounded-xl overflow-hidden">
            <img
              src={article.featured_image_url}
              alt={article.featured_image_alt || article.title}
              className="w-full h-auto"
              loading="eager"
            />
          </figure>
        )}

        {/* Article Body */}
        <BlogPost article={article} />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t flex flex-wrap gap-2">
            {article.tags.map((tag: string) => (
              <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Citations */}
        {article.citations && article.citations.length > 0 && (
          <section className="mt-8 pt-6 border-t">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Sources</h2>
            <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
              {article.citations.map((citation: any, index: number) => (
                <li key={index}>
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {citation.title || citation.url}
                  </a>
                  {citation.snippet && (
                    <span className="text-gray-400 ml-1">— {citation.snippet}</span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Share */}
        <div className="mt-8 pt-6 border-t flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Share:</span>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(`/blog/${article.slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:underline"
          >
            Twitter
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`/blog/${article.slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-700 hover:underline"
          >
            LinkedIn
          </a>
        </div>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <RelatedPosts articles={relatedArticles} />
      )}
    </>
  )
}
