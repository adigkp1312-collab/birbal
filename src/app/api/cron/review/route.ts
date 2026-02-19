import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

interface ReviewResult {
  scores: {
    accuracy: number
    seo: number
    readability: number
    originality: number
    completeness: number
  }
  overall_score: number
  passed: boolean
  feedback: string
  issues: string[]
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseClient()

    // 1. Fetch all articles in 'review' status
    const { data: articles } = await supabase
      .from('blog_articles')
      .select('*, blog_config!inner(review_threshold, auto_publish_after_review, base_url)')
      .eq('status', 'review')
      .limit(10)

    // Fallback: if join doesn't work, fetch articles and configs separately
    let articlesToReview = articles
    if (!articlesToReview || articlesToReview.length === 0) {
      const { data: reviewArticles } = await supabase
        .from('blog_articles')
        .select('*')
        .eq('status', 'review')
        .limit(10)

      articlesToReview = reviewArticles
    }

    if (!articlesToReview || articlesToReview.length === 0) {
      return NextResponse.json({ message: 'No articles to review' })
    }

    const results: { articleId: string; title: string; passed: boolean; score: number }[] = []

    for (const article of articlesToReview) {
      // Get config for this user
      const { data: config } = await supabase
        .from('blog_config')
        .select('*')
        .eq('user_id', article.user_id)
        .single()

      const reviewThreshold = config?.review_threshold || 0.7
      const autoPublish = config?.auto_publish_after_review !== false

      // 2. Build article text for review
      const articleContent = {
        title: article.title,
        meta_description: article.meta_description,
        h1: article.h1,
        introduction: article.introduction,
        sections: article.sections,
        conclusion: article.conclusion,
        keywords: article.keywords,
        word_count: article.word_count,
        citations: article.citations,
        category: article.category,
      }

      // 3. Review with Gemini + Google Search Grounding (for fact-checking)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        tools: [{ googleSearch: {} } as any],
      })

      const reviewPrompt = `You are a senior editorial reviewer and SEO expert. Review this blog article rigorously.

ARTICLE TO REVIEW:
${JSON.stringify(articleContent, null, 2)}

Score EACH dimension from 0.0 to 1.0 and explain your reasoning:

1. FACTUAL ACCURACY (weight: 30%):
   - Search the web to verify key claims, statistics, and data points
   - Check if cited sources actually exist and say what's claimed
   - Flag any hallucinated or unverifiable claims

2. SEO QUALITY (weight: 25%):
   - Is the title under 60 chars and keyword-optimized?
   - Is the meta description under 160 chars with primary keyword?
   - Are H2 headings keyword-rich and well-structured?
   - Is keyword density natural (1-3%)?
   - Are there internal links?

3. READABILITY (weight: 20%):
   - Is the introduction engaging?
   - Are paragraphs the right length (3-5 sentences)?
   - Is the tone consistent throughout?
   - Does it flow logically from section to section?

4. ORIGINALITY (weight: 15%):
   - Does this offer genuine value or is it generic AI content?
   - Are there unique insights, angles, or data?
   - Would a reader learn something they can't easily find elsewhere?

5. COMPLETENESS (weight: 10%):
   - Does it cover the topic thoroughly for the target word count?
   - Are there obvious gaps or missing subtopics?
   - Does the conclusion include a clear CTA?

Also identify specific ISSUES that must be fixed.

Return ONLY valid JSON (no markdown, no code fences):
{
  "scores": {
    "accuracy": 0.0,
    "seo": 0.0,
    "readability": 0.0,
    "originality": 0.0,
    "completeness": 0.0
  },
  "overall_score": 0.0,
  "passed": false,
  "feedback": "Overall editorial feedback in 2-3 sentences",
  "issues": ["Issue 1", "Issue 2"]
}`

      const reviewResult = await model.generateContent(reviewPrompt)
      const reviewText = reviewResult.response.text()

      const jsonMatch = reviewText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error('Failed to parse review for article:', article.id)
        continue
      }

      const review: ReviewResult = JSON.parse(jsonMatch[0])

      // Calculate weighted overall score
      const weightedScore =
        review.scores.accuracy * 0.3 +
        review.scores.seo * 0.25 +
        review.scores.readability * 0.2 +
        review.scores.originality * 0.15 +
        review.scores.completeness * 0.1

      review.overall_score = Math.round(weightedScore * 100) / 100
      review.passed = review.overall_score >= reviewThreshold

      // 4. Store review
      await supabase.from('article_reviews').insert({
        article_id: article.id,
        overall_score: review.overall_score,
        scores: review.scores,
        feedback: review.feedback,
        issues: review.issues,
        passed: review.passed,
      })

      // 5. Update article status
      if (review.passed && autoPublish) {
        // Publish!
        await supabase
          .from('blog_articles')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            review: review,
          })
          .eq('id', article.id)
      } else if (!review.passed && (article.retry_count || 0) < 1) {
        // Auto-retry: set back to draft with feedback for regeneration
        await supabase
          .from('blog_articles')
          .update({
            status: 'rejected',
            review: review,
            retry_count: (article.retry_count || 0) + 1,
          })
          .eq('id', article.id)

        // Trigger regeneration with feedback (async — don't await)
        await regenerateWithFeedback(supabase, article, review)
      } else {
        // Max retries reached or auto-publish disabled — leave as rejected
        await supabase
          .from('blog_articles')
          .update({
            status: review.passed ? 'review' : 'rejected', // If passed but no auto-publish, keep in review
            review: review,
          })
          .eq('id', article.id)
      }

      results.push({
        articleId: article.id,
        title: article.title,
        passed: review.passed,
        score: review.overall_score,
      })
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Review error:', error)
    return NextResponse.json(
      { error: 'Failed to review articles' },
      { status: 500 }
    )
  }
}

async function regenerateWithFeedback(
  supabase: any,
  article: any,
  review: ReviewResult
) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })

    // Get config
    const { data: config } = await supabase
      .from('blog_config')
      .select('*')
      .eq('user_id', article.user_id)
      .single()

    // Get voice profile
    const { data: voiceProfile } = await supabase
      .from('user_voice_profiles')
      .select('*')
      .eq('user_id', article.user_id)
      .single()

    const voiceContext = voiceProfile?.is_calibrated
      ? `Brand Voice: ${voiceProfile.tone}, ${voiceProfile.vocabulary_level}`
      : `Brand Voice: ${config?.default_tone || 'professional'}`

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [{ googleSearch: {} } as any],
    })

    const regeneratePrompt = `Rewrite and improve this blog article based on editorial feedback.

ORIGINAL ARTICLE:
Title: ${article.title}
Introduction: ${article.introduction}
Sections: ${JSON.stringify(article.sections)}
Conclusion: ${article.conclusion}

REVIEW FEEDBACK:
Score: ${review.overall_score}/1.0
Feedback: ${review.feedback}
Issues to fix:
${review.issues.map((i: string) => `- ${i}`).join('\n')}

Detailed scores:
- Accuracy: ${review.scores.accuracy}
- SEO: ${review.scores.seo}
- Readability: ${review.scores.readability}
- Originality: ${review.scores.originality}
- Completeness: ${review.scores.completeness}

${voiceContext}

FIX ALL ISSUES and improve the weakest-scoring areas. Search the web to verify facts and add citations.

Return ONLY valid JSON (no markdown, no code fences):
{
  "title": "Improved title (max 60 chars)",
  "meta_description": "Improved meta (max 155 chars)",
  "slug": "${article.slug}",
  "h1": "Improved H1",
  "introduction": "Improved intro",
  "sections": [{"heading": "H2", "content": "Improved content"}],
  "conclusion": "Improved conclusion",
  "keywords": ["kw1", "kw2"],
  "citations": [{"url": "...", "title": "...", "snippet": "..."}]
}`

    const result = await model.generateContent(regeneratePrompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      console.error('Failed to parse regenerated article')
      return
    }

    const improved = JSON.parse(jsonMatch[0])

    // Extract grounding citations
    const grounding = (result.response as any).candidates?.[0]?.groundingMetadata
    const groundingCitations = grounding?.groundingChunks?.map(
      (chunk: any) => ({
        url: chunk.web?.uri || '',
        title: chunk.web?.title || '',
      })
    ).filter((c: any) => c.url) || []

    const allCitations = [...(improved.citations || []), ...groundingCitations]
    const uniqueCitations = allCitations.filter(
      (c, i, arr) => arr.findIndex(x => x.url === c.url) === i
    )

    // Generate new embedding
    const embeddingText = `${improved.title} ${improved.meta_description} ${improved.keywords.join(' ')}`
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: embeddingText,
    })

    const fullText = [
      improved.introduction,
      ...improved.sections.map((s: any) => s.content),
      improved.conclusion,
    ].join(' ')

    // Update the article with improvements
    await supabase
      .from('blog_articles')
      .update({
        title: improved.title,
        meta_description: improved.meta_description,
        h1: improved.h1,
        introduction: improved.introduction,
        sections: improved.sections,
        conclusion: improved.conclusion,
        keywords: improved.keywords,
        word_count: fullText.split(/\s+/).length,
        citations: uniqueCitations,
        status: 'review', // Back to review queue
        embedding: JSON.stringify(embeddingResponse.data[0].embedding),
        generation_metadata: {
          ...article.generation_metadata,
          regenerated: true,
          regenerated_at: new Date().toISOString(),
          previous_review: review,
        },
      })
      .eq('id', article.id)
  } catch (error) {
    console.error('Regeneration failed:', error)
  }
}
