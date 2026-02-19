import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://birbal.app'

  const { data: articles } = await supabase
    .from('blog_articles')
    .select('slug, title, meta_description, author, published_at, category')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20)

  const items = (articles || [])
    .map(article => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${baseUrl}/blog/${article.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${article.slug}</guid>
      <description><![CDATA[${article.meta_description || ''}]]></description>
      <author>${article.author || 'Birbal'}</author>
      ${article.category ? `<category>${article.category}</category>` : ''}
      <pubDate>${new Date(article.published_at).toUTCString()}</pubDate>
    </item>`)
    .join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Birbal Blog</title>
    <link>${baseUrl}/blog</link>
    <description>AI-powered insights and trending analysis, auto-generated and fact-checked.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
