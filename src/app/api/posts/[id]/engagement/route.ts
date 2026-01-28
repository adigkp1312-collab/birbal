import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { actual_likes, actual_comments, actual_impressions, user_rating } = await request.json()

    const { data, error } = await supabase
      .from('generated_posts')
      .update({
        was_posted: true,
        actual_likes,
        actual_comments,
        actual_impressions,
        user_rating,
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update engagement:', error)
      return NextResponse.json(
        { error: 'Failed to update engagement' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Engagement update error:', error)
    return NextResponse.json(
      { error: 'Failed to update engagement' },
      { status: 500 }
    )
  }
}
