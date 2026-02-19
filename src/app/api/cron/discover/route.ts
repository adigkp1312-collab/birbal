import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

interface DiscoveredTopic {
  topic: string
  suggested_title: string
  target_keywords: string[]
  category: string
  reasoning: string
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseClient()

    // 1. Load blog config for niche keywords
    const { data: configs } = await supabase
      .from('blog_config')
      .select('*')
      .limit(10)

    if (!configs || configs.length === 0) {
      return NextResponse.json({ error: 'No blog configs found' }, { status: 404 })
    }

    let totalTopicsInserted = 0

    for (const config of configs) {
      const nicheKeywords = config.niche_keywords || ['technology', 'AI']

      // 2. Load existing article slugs to avoid duplicates
      const { data: existingArticles } = await supabase
        .from('blog_articles')
        .select('slug, title')
        .eq('user_id', config.user_id)

      const existingTitles = (existingArticles || []).map(a => a.title).join(', ')

      // 3. Load existing pending topics to avoid duplicates
      const { data: existingTopics } = await supabase
        .from('trending_topics')
        .select('topic')
        .gt('expires_at', new Date().toISOString())

      const existingTopicNames = (existingTopics || []).map(t => t.topic).join(', ')

      // 4. Use Gemini with Google Search Grounding to discover topics
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        tools: [{ googleSearch: {} } as any],
      })

      const prompt = `You are an SEO content strategist with access to real-time web search.
Search the web for the most trending and high-search-volume topics in these niches: ${nicheKeywords.join(', ')}.

Find 5 topics that:
1. Are trending RIGHT NOW (last 7 days)
2. Have high search volume potential
3. Don't overlap with these existing articles: ${existingTitles || 'none yet'}
4. Don't overlap with these pending topics: ${existingTopicNames || 'none'}
5. Can be turned into comprehensive, linkable blog posts of ${config.default_word_count || 1200}+ words

Categories to use: ${(config.categories || ['Technology', 'AI', 'Tutorials']).join(', ')}

Return ONLY a valid JSON array (no markdown, no code fences):
[
  {
    "topic": "concise topic name (2-5 words)",
    "suggested_title": "SEO-optimized blog title (max 60 chars)",
    "target_keywords": ["keyword1", "keyword2", "keyword3"],
    "category": "one of the categories listed above",
    "reasoning": "why this topic is trending and worth writing about"
  }
]`

      const result = await model.generateContent(prompt)
      const responseText = result.response.text()

      // Extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.error('Failed to parse topics from Gemini response')
        continue
      }

      const topics: DiscoveredTopic[] = JSON.parse(jsonMatch[0])

      // 5. Extract grounding citations if available
      const groundingMetadata = (result.response as any).candidates?.[0]?.groundingMetadata
      const sourceUrls = groundingMetadata?.groundingChunks?.map(
        (chunk: any) => chunk.web?.uri
      ).filter(Boolean) || []

      // 6. Store topics with embeddings
      for (const topic of topics) {
        const embeddingText = `${topic.topic} ${topic.suggested_title} ${topic.target_keywords.join(' ')}`
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: embeddingText,
        })
        const embedding = embeddingResponse.data[0].embedding

        const { error } = await supabase.from('trending_topics').insert({
          topic: topic.topic,
          category: topic.category,
          suggested_angles: [topic.suggested_title, topic.reasoning],
          industries: topic.target_keywords,
          relevance_score: 0.8 + Math.random() * 0.2,
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks
          embedding: JSON.stringify(embedding),
        })

        if (!error) totalTopicsInserted++
      }
    }

    return NextResponse.json({
      success: true,
      topicsInserted: totalTopicsInserted,
    })
  } catch (error) {
    console.error('Topic discovery error:', error)
    return NextResponse.json(
      { error: 'Failed to discover topics' },
      { status: 500 }
    )
  }
}
