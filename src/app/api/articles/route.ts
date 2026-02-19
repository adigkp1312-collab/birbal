import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// GET: Public — list published articles (with optional filters)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'published'
  const category = searchParams.get('category')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '12', 10)
  const offset = (page - 1) * limit
  const admin = searchParams.get('admin') === 'true'

  // For admin requests, use auth
  if (admin) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('blog_articles')
      .select('id, slug, title, meta_description, category, status, published_at, created_at, word_count, review, tags', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status !== 'all') {
      query = query.eq('status', status)
    }
    if (category) {
      query = query.eq('category', category)
    }

    const { data, count, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      articles: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    })
  }

  // Public: only published articles
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  let query = supabase
    .from('blog_articles')
    .select('id, slug, title, meta_description, h1, category, tags, featured_image_url, featured_image_alt, author, published_at, word_count', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (category) {
    query = query.eq('category', category)
  }

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    articles: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  })
}

// POST: Auth — create or update article
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    const articleData = {
      user_id: user.id,
      slug: body.slug,
      title: body.title,
      meta_description: body.meta_description,
      h1: body.h1 || body.title,
      introduction: body.introduction,
      sections: body.sections || [],
      conclusion: body.conclusion,
      keywords: body.keywords || [],
      word_count: body.word_count || 0,
      featured_image_url: body.featured_image_url,
      featured_image_alt: body.featured_image_alt,
      author: body.author,
      category: body.category,
      tags: body.tags || [],
      status: body.status || 'draft',
      citations: body.citations || [],
      seo: body.seo || {},
    }

    const { data, error } = await supabase
      .from('blog_articles')
      .insert(articleData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ article: data })
  } catch (error) {
    console.error('Create article error:', error)
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    )
  }
}
