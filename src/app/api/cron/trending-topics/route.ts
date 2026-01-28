import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key'
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Google News RSS feeds
const RSS_FEEDS = [
  'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en', // Business
  'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en', // Technology
  'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZ4ZERBU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en', // Careers
]

async function fetchRSSFeed(url: string): Promise<string[]> {
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } })
    const xml = await response.text()
    
    // Extract titles from RSS
    const titleMatches = xml.match(/<title>(?!Google News)([^<]+)<\/title>/g)
    if (!titleMatches) return []
    
    return titleMatches
      .map(t => t.replace(/<\/?title>/g, ''))
      .filter(t => t.length > 10 && !t.includes('Google News'))
      .slice(0, 20)
  } catch (error) {
    console.error('Failed to fetch RSS:', error)
    return []
  }
}

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch all RSS feeds
    const allHeadlines: string[] = []
    for (const feed of RSS_FEEDS) {
      const headlines = await fetchRSSFeed(feed)
      allHeadlines.push(...headlines)
    }

    if (allHeadlines.length === 0) {
      return NextResponse.json({ error: 'No headlines fetched' }, { status: 500 })
    }

    // Use Gemini to extract topics and angles
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const extractionPrompt = `Analyze these news headlines and extract the top 10 trending topics relevant to professionals on LinkedIn.

Headlines:
${allHeadlines.join('\n')}

For each topic, provide:
1. The main topic (concise, 2-5 words)
2. Category (Business, Technology, Careers, Leadership, or Industry Trends)
3. 3 suggested angles for LinkedIn posts
4. Relevant industries

Return as JSON array:
[
  {
    "topic": "topic name",
    "category": "category",
    "suggested_angles": ["angle 1", "angle 2", "angle 3"],
    "industries": ["industry 1", "industry 2"]
  }
]`

    const result = await model.generateContent(extractionPrompt)
    const responseText = result.response.text()
    
    // Extract JSON
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('Failed to parse topics from Gemini response')
    }
    
    const topics = JSON.parse(jsonMatch[0])

    const supabase = getSupabaseClient()

    // Clear old topics and insert new ones
    await supabase.from('trending_topics').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Insert topics with embeddings
    for (const topic of topics) {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: `${topic.topic} ${topic.category} ${topic.suggested_angles.join(' ')}`,
      })
      const embedding = embeddingResponse.data[0].embedding

      await supabase.from('trending_topics').insert({
        topic: topic.topic,
        category: topic.category,
        suggested_angles: topic.suggested_angles,
        industries: topic.industries,
        relevance_score: 0.8 + Math.random() * 0.2,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        embedding: JSON.stringify(embedding),
      })
    }

    return NextResponse.json({ 
      success: true, 
      topicsInserted: topics.length 
    })
  } catch (error) {
    console.error('Trending topics error:', error)
    return NextResponse.json(
      { error: 'Failed to update trending topics' },
      { status: 500 }
    )
  }
}
