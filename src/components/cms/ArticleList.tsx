'use client'

import Link from 'next/link'

interface Article {
  id: string
  slug: string
  title: string
  category: string
  status: string
  published_at: string | null
  created_at: string
  word_count: number
  review: any
  retry_count: number
}

interface ArticleListProps {
  articles: Article[]
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  review: 'bg-yellow-100 text-yellow-700',
  published: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export function ArticleList({ articles }: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No articles found.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-sm text-gray-500">
            <th className="pb-3 font-medium">Title</th>
            <th className="pb-3 font-medium">Category</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Score</th>
            <th className="pb-3 font-medium">Words</th>
            <th className="pb-3 font-medium">Date</th>
            <th className="pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {articles.map(article => (
            <tr key={article.id} className="text-sm hover:bg-gray-50">
              <td className="py-3 pr-4">
                <div className="max-w-xs">
                  <p className="font-medium text-gray-900 truncate">{article.title}</p>
                  <p className="text-xs text-gray-400 truncate">/blog/{article.slug}</p>
                </div>
              </td>
              <td className="py-3 pr-4">
                <span className="text-gray-600">{article.category || '—'}</span>
              </td>
              <td className="py-3 pr-4">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[article.status] || ''}`}>
                  {article.status}
                  {article.retry_count > 0 && (
                    <span className="ml-1 opacity-60">(retry {article.retry_count})</span>
                  )}
                </span>
              </td>
              <td className="py-3 pr-4">
                {article.review?.overall_score != null ? (
                  <span className={`font-mono text-xs ${article.review.overall_score >= 0.7 ? 'text-green-600' : 'text-red-600'}`}>
                    {(article.review.overall_score * 100).toFixed(0)}%
                  </span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="py-3 pr-4 text-gray-600">
                {article.word_count?.toLocaleString() || '—'}
              </td>
              <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                {new Date(article.published_at || article.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric'
                })}
              </td>
              <td className="py-3">
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/dashboard/articles/${article.id}`}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    Edit
                  </Link>
                  {article.status === 'published' && (
                    <Link
                      href={`/blog/${article.slug}`}
                      target="_blank"
                      className="text-green-600 hover:underline text-xs"
                    >
                      View
                    </Link>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
