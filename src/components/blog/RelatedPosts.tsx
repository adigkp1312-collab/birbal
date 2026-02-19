import Link from 'next/link'

interface RelatedArticle {
  id: string
  slug: string
  title: string
  category: string
  meta_description: string
  published_at: string
}

interface RelatedPostsProps {
  articles: RelatedArticle[]
}

export function RelatedPosts({ articles }: RelatedPostsProps) {
  if (articles.length === 0) return null

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map(article => (
          <Link
            key={article.id}
            href={`/blog/${article.slug}`}
            className="group block rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            {article.category && (
              <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium mb-2">
                {article.category}
              </span>
            )}
            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
              {article.title}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2">
              {article.meta_description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
