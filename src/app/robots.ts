import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://birbal.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/cron/', '/api/stripe/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
