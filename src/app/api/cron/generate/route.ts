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

interface GeneratedArticle {
  title: string
  meta_description: string
  slug: string
  h1: string
  introduction: string
  sections: { heading: string; content: string }[]
  conclusion: string
  keywords: string[]
  citations: { url: string; title: string; snippet?: string }[]
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseClient()
    const articlesGenerated: string[] = []

    // Process each user's blog config
    const { data: configs } = await supabase
      .from('blog_config')
      .select('*')
      .limit(10)

    if (!configs || configs.length === 0) {
      return NextResponse.json({ error: 'No blog configs found' }, { status: 404 })
    }

    for (const config of configs) {
      // 1. Check weekly article limit
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { count: weeklyCount } = await supabase
        .from('blog_articles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', config.user_id)
        .gte('created_at', weekAgo)

      if ((weeklyCount || 0) >= (config.max_articles_per_week || 3)) {
        continue // Skip — weekly limit reached
      }

      // 2. Pick highest-priority pending topic
      const { data: topics } = await supabase
        .from('trending_topics')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('relevance_score', { ascending: false })
        .limit(1)

      if (!topics || topics.length === 0) continue

      const topic = topics[0]

      // 3. Get brand voice profile
      const { data: voiceProfile } = await supabase
        .from('user_voice_profiles')
        .select('*')
        .eq('user_id', config.user_id)
        .single()

      // 4. RAG: Find matching templates
      const topicEmbeddingText = `${topic.topic} ${(topic.suggested_angles || []).join(' ')}`
      const topicEmbeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: topicEmbeddingText,
      })
      const topicEmbedding = topicEmbeddingResponse.data[0].embedding

      const { data: matchedTemplates } = await supabase.rpc('match_templates', {
        query_embedding: JSON.stringify(topicEmbedding),
        match_threshold: 0.3,
        match_count: 3,
      })

      // 5. RAG: Find related published articles for internal linking
      const { data: relatedArticles } = await supabase.rpc('match_articles', {
        query_embedding: JSON.stringify(topicEmbedding),
        match_threshold: 0.3,
        match_count: 5,
      })

      const internalLinks = (relatedArticles || [])
        .map((a: any) => `- "${a.title}" at /blog/${a.slug}`)
        .join('\n')

      // 6. Build voice context
      const voiceContext = voiceProfile?.is_calibrated
        ? `Brand Voice:
- Tone: ${voiceProfile.tone}
- Formality: ${Math.round((voiceProfile.formality_score || 0.5) * 100)}%
- Storytelling: ${voiceProfile.storytelling_style}
- Vocabulary: ${voiceProfile.vocabulary_level}
- Common phrases: ${(voiceProfile.common_phrases || []).join(', ')}`
        : `Brand Voice: ${config.default_tone || 'professional'}, approachable, expert`

      // 7. Build template context
      const templateContext = matchedTemplates && matchedTemplates.length > 0
        ? `Use this template structure as inspiration:\n${matchedTemplates[0].template_structure}`
        : ''

      // 8. STEP 1: Deep research with Google Search Grounding
      const researchModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        tools: [{ googleSearch: {} } as any],
      })

      const researchResult = await researchModel.generateContent(
        `Research this topic thoroughly for a blog article: "${topic.topic}"
${topic.suggested_angles?.[0] ? `Suggested title: "${topic.suggested_angles[0]}"` : ''}
Target keywords: ${(topic.industries || []).join(', ')}

Search the web and find:
1. Top 5 competing articles on this topic — summarize their structure, key points, and word count
2. Key statistics, data points, and expert quotes with sources
3. Unique angles that competitors missed
4. Related questions people are searching for (People Also Ask)
5. Current news/events related to this topic

Return a structured research brief with ALL sources cited as URLs.`
      )

      const researchData = researchResult.response.text()

      // Extract grounding citations from research
      const researchGrounding = (researchResult.response as any).candidates?.[0]?.groundingMetadata
      const researchCitations = researchGrounding?.groundingChunks?.map(
        (chunk: any) => ({
          url: chunk.web?.uri || '',
          title: chunk.web?.title || '',
        })
      ).filter((c: any) => c.url) || []

      // 9. STEP 2: Generate the article with research context
      const writeModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        tools: [{ googleSearch: {} } as any],
      })

      const articlePrompt = `Write a comprehensive, SEO-optimized blog article.

TOPIC: ${topic.topic}
TARGET KEYWORDS: ${(topic.industries || []).join(', ')}
WORD COUNT TARGET: ${config.default_word_count || 1200} words

RESEARCH DATA:
${researchData}

${voiceContext}

${templateContext}

${internalLinks ? `INTERNAL LINKS (include naturally in the article where relevant):\n${internalLinks}` : ''}

REQUIREMENTS:
1. Write a compelling, SEO-optimized title (max 60 chars)
2. Write a meta_description (max 155 chars, include primary keyword)
3. Generate a URL-friendly slug (lowercase, hyphens)
4. Write a strong H1 that matches search intent
5. Include an engaging introduction (2-3 paragraphs)
6. Write 4-6 sections with H2 headings, each 150-250 words
7. Include statistics and data points from the research WITH inline citations
8. Write a conclusion with a call-to-action
9. Use the target keywords naturally (not stuffed)
10. Include internal links to our existing articles where relevant
11. Match the brand voice

Return ONLY a valid JSON object (no markdown, no code fences):
{
  "title": "SEO title (max 60 chars)",
  "meta_description": "Meta description (max 155 chars)",
  "slug": "url-friendly-slug",
  "h1": "Main heading",
  "introduction": "Full introduction text with paragraphs",
  "sections": [
    {"heading": "H2 heading", "content": "Section content with inline [citations](url)"}
  ],
  "conclusion": "Conclusion with CTA",
  "keywords": ["primary", "secondary", "tertiary"],
  "citations": [{"url": "https://...", "title": "Source title", "snippet": "relevant quote"}]
}`

      const articleResult = await writeModel.generateContent(articlePrompt)
      const articleText = articleResult.response.text()

      // Extract article grounding citations
      const articleGrounding = (articleResult.response as any).candidates?.[0]?.groundingMetadata
      const articleCitations = articleGrounding?.groundingChunks?.map(
        (chunk: any) => ({
          url: chunk.web?.uri || '',
          title: chunk.web?.title || '',
        })
      ).filter((c: any) => c.url) || []

      // Parse the generated article
      const jsonMatch = articleText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error('Failed to parse article JSON from Gemini')
        continue
      }

      const article: GeneratedArticle = JSON.parse(jsonMatch[0])

      // Merge all citations
      const allCitations = [
        ...researchCitations,
        ...articleCitations,
        ...(article.citations || []),
      ]
      // Deduplicate by URL
      const uniqueCitations = allCitations.filter(
        (c, i, arr) => arr.findIndex(x => x.url === c.url) === i
      )

      // 10. Generate article embedding
      const articleEmbeddingText = `${article.title} ${article.meta_description} ${article.keywords.join(' ')}`
      const articleEmbeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: articleEmbeddingText,
      })
      const articleEmbedding = articleEmbeddingResponse.data[0].embedding

      // Calculate word count
      const fullText = [
        article.introduction,
        ...article.sections.map(s => s.content),
        article.conclusion,
      ].join(' ')
      const wordCount = fullText.split(/\s+/).length

      // 11. Store article with status='review'
      const { error: saveError } = await supabase
        .from('blog_articles')
        .insert({
          user_id: config.user_id,
          slug: article.slug,
          title: article.title,
          meta_description: article.meta_description,
          h1: article.h1,
          introduction: article.introduction,
          sections: article.sections,
          conclusion: article.conclusion,
          keywords: article.keywords,
          word_count: wordCount,
          author: config.default_author || 'Adiyogi Arts',
          category: topic.category,
          tags: article.keywords,
          status: 'review',
          topic_id: topic.id,
          citations: uniqueCitations,
          generation_metadata: {
            model: 'gemini-2.5-flash',
            grounding: true,
            research_queries: researchGrounding?.webSearchQueries || [],
            article_queries: articleGrounding?.webSearchQueries || [],
            generated_at: new Date().toISOString(),
          },
          seo: {
            canonical_url: `${config.base_url || ''}/blog/${article.slug}`,
            og_title: article.title,
            og_description: article.meta_description,
          },
          embedding: JSON.stringify(articleEmbedding),
        })
        .select()
        .single()

      if (saveError) {
        console.error('Failed to save article:', saveError)
        continue
      }

      // 12. Mark topic as used
      await supabase
        .from('trending_topics')
        .update({ expires_at: new Date().toISOString() }) // Expire it
        .eq('id', topic.id)

      articlesGenerated.push(article.title)
    }

    return NextResponse.json({
      success: true,
      articlesGenerated,
    })
  } catch (error) {
    console.error('Article generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate articles' },
      { status: 500 }
    )
  }
}
