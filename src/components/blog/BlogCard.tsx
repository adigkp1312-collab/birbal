import Link from 'next/link'

interface BlogCardProps {
  article: {
    id: string
    slug: string
    title: string
    meta_description: string
    category: string
    featured_image_url: string | null
    featured_image_alt: string | null
    author: string
    published_at: string
    word_count: number
  }
}

export function BlogCard({ article }: BlogCardProps) {
  const readingTime = Math.ceil(article.word_count / 200)

  return (
    <Link href={`/blog/${article.slug}`} className="group block">
      <article className="h-full rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow bg-white">
        {article.featured_image_url && (
          <div className="aspect-video overflow-hidden bg-gray-100">
            <img
              src={article.featured_image_url}
              alt={article.featured_image_alt || article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}
        <div className="p-5">
          {article.category && (
            <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium mb-3">
              {article.category}
            </span>
          )}
          <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {article.title}
          </h2>
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {article.meta_description}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <time dateTime={article.published_at}>
              {new Date(article.published_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              })}
            </time>
            <span>{readingTime} min read</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
