import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()

  try {
    const { data: topics, error } = await supabase
      .from('trending_topics')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('relevance_score', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Failed to fetch trending topics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch topics' },
        { status: 500 }
      )
    }

    return NextResponse.json({ topics: topics || [] })
  } catch (error) {
    console.error('Trending topics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    )
  }
}
