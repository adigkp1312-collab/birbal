interface StructuredDataProps {
  article: {
    title: string
    meta_description: string
    h1: string
    slug: string
    author: string
    published_at: string
    updated_at: string
    featured_image_url?: string | null
    word_count: number
    keywords?: string[]
    seo?: {
      canonical_url?: string
    }
  }
}

export function StructuredData({ article }: StructuredDataProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.h1 || article.title,
    description: article.meta_description,
    image: article.featured_image_url || undefined,
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    wordCount: article.word_count,
    keywords: article.keywords?.join(', '),
    url: article.seo?.canonical_url || `/blog/${article.slug}`,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Birbal',
      logo: {
        '@type': 'ImageObject',
        url: '/favicon.ico',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.seo?.canonical_url || `/blog/${article.slug}`,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
