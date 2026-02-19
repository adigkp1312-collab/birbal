-- ============================================================
-- Blog CMS Schema Migration
-- Adds blog_articles, blog_config, article_reviews tables
-- with vector search, RLS, and helper functions
-- ============================================================

-- Blog Articles
CREATE TABLE public.blog_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT,
  h1 TEXT,
  introduction TEXT,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  conclusion TEXT,
  keywords TEXT[],
  word_count INT DEFAULT 0,
  featured_image_url TEXT,
  featured_image_alt TEXT,
  author TEXT DEFAULT 'Adiyogi Arts',
  category TEXT,
  tags TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'rejected')),
  scheduled_publish_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  topic_id UUID REFERENCES public.trending_topics(id) ON DELETE SET NULL,
  citations JSONB DEFAULT '[]'::jsonb,
  generation_metadata JSONB DEFAULT '{}'::jsonb,
  seo JSONB DEFAULT '{}'::jsonb,
  review JSONB DEFAULT '{}'::jsonb,
  retry_count INT DEFAULT 0,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_articles_status ON public.blog_articles(status);
CREATE INDEX idx_articles_slug ON public.blog_articles(slug);
CREATE INDEX idx_articles_published ON public.blog_articles(published_at DESC);
CREATE INDEX idx_articles_category ON public.blog_articles(category);
CREATE INDEX idx_articles_user ON public.blog_articles(user_id);
CREATE INDEX idx_articles_embedding ON public.blog_articles
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Blog Config (per user)
CREATE TABLE public.blog_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  site_name TEXT DEFAULT 'My Blog',
  site_description TEXT DEFAULT 'An AI-powered blog',
  base_url TEXT,
  default_author TEXT DEFAULT 'Adiyogi Arts',
  niche_keywords TEXT[] DEFAULT ARRAY['technology', 'AI']::TEXT[],
  publish_schedule TEXT DEFAULT '0 9 * * 1,3,5',
  max_articles_per_week INT DEFAULT 3,
  default_word_count INT DEFAULT 1200,
  default_tone TEXT DEFAULT 'professional',
  categories TEXT[] DEFAULT ARRAY['Technology', 'AI', 'Tutorials', 'Industry Trends']::TEXT[],
  auto_publish_after_review BOOLEAN DEFAULT TRUE,
  review_threshold FLOAT DEFAULT 0.7,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article Reviews (AI quality gate)
CREATE TABLE public.article_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  overall_score FLOAT,
  scores JSONB DEFAULT '{}'::jsonb,
  feedback TEXT,
  issues TEXT[],
  passed BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_article ON public.article_reviews(article_id);

-- ============================================================
-- Vector Search Functions
-- ============================================================

-- Match similar articles (for related posts & deduplication)
CREATE OR REPLACE FUNCTION match_articles(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  category TEXT,
  meta_description TEXT,
  published_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id, a.slug, a.title, a.category, a.meta_description, a.published_at,
    1 - (a.embedding <=> query_embedding) AS similarity
  FROM public.blog_articles a
  WHERE a.status = 'published'
    AND a.embedding IS NOT NULL
    AND 1 - (a.embedding <=> query_embedding) > match_threshold
  ORDER BY a.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- Auto-update updated_at timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION update_blog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_articles_updated_at
  BEFORE UPDATE ON public.blog_articles
  FOR EACH ROW EXECUTE FUNCTION update_blog_updated_at();

CREATE TRIGGER blog_config_updated_at
  BEFORE UPDATE ON public.blog_config
  FOR EACH ROW EXECUTE FUNCTION update_blog_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_reviews ENABLE ROW LEVEL SECURITY;

-- Blog Articles: public can read published, owners can manage all
CREATE POLICY "Public read published articles"
  ON public.blog_articles FOR SELECT
  USING (status = 'published');

CREATE POLICY "Users manage own articles"
  ON public.blog_articles FOR ALL
  USING (auth.uid() = user_id);

-- Blog Config: only owner
CREATE POLICY "Users manage own config"
  ON public.blog_config FOR ALL
  USING (auth.uid() = user_id);

-- Article Reviews: only owner (via article)
CREATE POLICY "Users read own reviews"
  ON public.article_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.blog_articles
      WHERE blog_articles.id = article_reviews.article_id
        AND blog_articles.user_id = auth.uid()
    )
  );
