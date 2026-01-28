import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })

// GET - Fetch existing voice profile
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('user_voice_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: profile || null })
}

// POST - Create or update voice profile
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { samples } = await request.json()

    if (!samples || !Array.isArray(samples) || samples.length < 3) {
      return NextResponse.json(
        { error: 'At least 3 writing samples required' },
        { status: 400 }
      )
    }

    // Analyze voice with Gemini Flash
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const analysisPrompt = `Analyze these writing samples and extract the author's voice characteristics. Provide a detailed analysis in JSON format.

Writing Samples:
${samples.map((s, i) => `Sample ${i + 1}:\n${s}`).join('\n\n---\n\n')}

Provide your analysis in this exact JSON format:
{
  "tone": "overall tone (e.g., professional yet conversational, authoritative, friendly, etc.)",
  "formality_score": 0.7,
  "emoji_usage": "description of emoji usage (e.g., occasional, frequent, never, strategic)",
  "vocabulary_level": "description (e.g., accessible, technical, sophisticated, simple)",
  "storytelling_style": "description of how they tell stories (e.g., personal anecdotes, data-driven, metaphor-heavy)",
  "common_phrases": ["phrase 1", "phrase 2", "phrase 3"],
  "sentence_structure": "description (e.g., short and punchy, long and complex, varied)",
  "paragraph_structure": "description (e.g., single sentences, dense paragraphs, strategic whitespace)",
  "opening_style": "how they typically open (e.g., questions, statements, stories)",
  "closing_style": "how they typically close (e.g., calls to action, questions, statements)",
  "use_of_humor": "description",
  "use_of_data": "description",
  "personal_vs_professional": "ratio description",
  "key_insights": ["insight 1", "insight 2", "insight 3"]
}

Be specific and detailed. The formality_score should be between 0 and 1.`

    const result = await model.generateContent(analysisPrompt)
    const analysisText = result.response.text()

    // Extract JSON from response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse analysis response')
    }

    const analysis = JSON.parse(jsonMatch[0])

    // Generate embedding from combined samples
    const combinedText = samples.join('\n\n')
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: combinedText,
    })
    const embedding = embeddingResponse.data[0].embedding

    // Save to database
    const { data: profile, error } = await supabase
      .from('user_voice_profiles')
      .upsert({
        user_id: user.id,
        writing_samples: samples,
        sample_count: samples.length,
        tone: analysis.tone,
        formality_score: analysis.formality_score,
        emoji_usage: analysis.emoji_usage,
        vocabulary_level: analysis.vocabulary_level,
        storytelling_style: analysis.storytelling_style,
        common_phrases: analysis.common_phrases,
        full_analysis: analysis,
        embedding: JSON.stringify(embedding),
        is_calibrated: true,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Voice profile analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze voice profile' },
      { status: 500 }
    )
  }
}
