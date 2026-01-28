import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })

interface Template {
  id: string
  name: string
  category: string
  template_structure: string
  example_post: string
}

interface CommunityPost {
  id: string
  content: string
  engagement_rate: number
  topic: string
}

interface UserMemory {
  id: string
  content: string
  content_type: string
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Check user's usage limits
    const { data: userData } = await supabase
      .from('users')
      .select('posts_generated_this_month, posts_limit, subscription_tier')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userData.posts_generated_this_month >= userData.posts_limit) {
      return NextResponse.json(
        { error: 'Monthly limit reached. Upgrade to Pro for more posts.' },
        { status: 403 }
      )
    }

    const { topic, context } = await request.json()

    if (!topic || topic.trim().length < 3) {
      return NextResponse.json(
        { error: 'Topic must be at least 3 characters' },
        { status: 400 }
      )
    }

    // 2. Get user's voice profile
    const { data: voiceProfile } = await supabase
      .from('user_voice_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // 3. Generate embedding for the topic
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: `${topic} ${context || ''}`,
    })
    const queryEmbedding = embeddingResponse.data[0].embedding

    // 4. RAG: Find similar templates
    const { data: similarTemplates } = await supabase.rpc('match_templates', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: 0.5,
      match_count: 5,
    })

    // 5. RAG: Find similar community posts
    const { data: similarPosts } = await supabase.rpc('match_community_posts', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: 0.5,
      match_count: 5,
    })

    // 6. RAG: Get user memory
    const { data: userMemory } = await supabase.rpc('match_user_memory', {
      p_user_id: user.id,
      query_embedding: JSON.stringify(queryEmbedding),
      match_count: 5,
    })

    // Build the prompt context
    const voiceContext = voiceProfile?.is_calibrated
      ? `
Voice Profile (MUST match this style):
- Tone: ${voiceProfile.tone}
- Formality: ${Math.round((voiceProfile.formality_score || 0.5) * 100)}%
- Storytelling: ${voiceProfile.storytelling_style}
- Vocabulary: ${voiceProfile.vocabulary_level}
- Emoji usage: ${voiceProfile.emoji_usage}
- Common phrases: ${(voiceProfile.common_phrases || []).join(', ')}
- Sentence structure: ${voiceProfile.full_analysis?.sentence_structure || 'varied'}
- Opening style: ${voiceProfile.full_analysis?.opening_style || 'varied'}
- Closing style: ${voiceProfile.full_analysis?.closing_style || 'varied'}
`
      : 'No voice profile calibrated yet. Use a professional yet conversational tone.'

    const templatesContext = similarTemplates && similarTemplates.length > 0
      ? `
Relevant Templates (use as structural inspiration):
${(similarTemplates as Template[]).map((t, i) => `
Template ${i + 1}: ${t.name} (${t.category})
Structure: ${t.template_structure}
Example: ${t.example_post?.substring(0, 200)}...`)
.join('\n---\n')}
`
      : ''

    const communityContext = similarPosts && similarPosts.length > 0
      ? `
High-Engagement Examples (for inspiration):
${(similarPosts as CommunityPost[]).map((p, i) => `
Example ${i + 1} (Engagement: ${p.engagement_rate || 'high'}):
${p.content?.substring(0, 300)}...`)
.join('\n---\n')}
`
      : ''

    const memoryContext = userMemory && userMemory.length > 0
      ? `
Your Previous Content (for consistency):
${(userMemory as UserMemory[]).map((m, i) => `
Memory ${i + 1} (${m.content_type}):
${m.content?.substring(0, 200)}...`)
.join('\n---\n')}
`
      : ''

    // Generate 3 variations with Gemini Flash
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const generateVariation = async (variationType: string) => {
      const variationInstructions = {
        conservative: 'Play it safe. Professional, measured, less controversial. Focus on solid insights without bold claims.',
        balanced: 'Middle ground. Professional but personable. Some personality while maintaining credibility.',
        bold: 'Take risks. Strong opinions, contrarian takes, bold statements. Be memorable and provocative (but not offensive).',
      }

      const prompt = `You are an expert LinkedIn content creator. Write a viral LinkedIn post about:

TOPIC: ${topic}
${context ? `ADDITIONAL CONTEXT: ${context}` : ''}

${voiceContext}

${templatesContext}

${communityContext}

${memoryContext}

VARIATION TYPE: ${variationType}
Instructions: ${variationInstructions[variationType as keyof typeof variationInstructions]}

Requirements:
1. Write ONLY the post content (no meta-commentary)
2. Use line breaks strategically for readability
3. Include a strong hook in the first line
4. End with a question or call-to-action
5. Match the voice profile style exactly
6. 150-300 words ideally
7. Make it engaging and shareable

Write the post now:`

      const result = await model.generateContent(prompt)
      return result.response.text().trim()
    }

    // Generate all 3 variations in parallel
    const [conservative, balanced, bold] = await Promise.all([
      generateVariation('conservative'),
      generateVariation('balanced'),
      generateVariation('bold'),
    ])

    // Save to generated_posts
    const templatesUsed = (similarTemplates as Template[])?.map((t) => t.id) || []

    const { data: generatedPost, error: saveError } = await supabase
      .from('generated_posts')
      .insert({
        user_id: user.id,
        input_topic: topic,
        input_context: context,
        generated_content: balanced, // Primary one
        variation_type: 'balanced',
        templates_used: templatesUsed,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save generated post:', saveError)
    }

    // Update usage count
    await supabase
      .from('users')
      .update({
        posts_generated_this_month: (userData.posts_generated_this_month || 0) + 1,
      })
      .eq('id', user.id)

    return NextResponse.json({
      variations: {
        conservative,
        balanced,
        bold,
      },
      postId: generatedPost?.id,
      templatesUsed: (similarTemplates as Template[])?.map((t) => ({
        name: t.name,
        category: t.category,
      })),
    })
  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate post' },
      { status: 500 }
    )
  }
}
