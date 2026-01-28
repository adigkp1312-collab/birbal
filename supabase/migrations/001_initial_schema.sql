CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  niche TEXT,
  subscription_tier TEXT DEFAULT 'free',
  posts_generated_this_month INT DEFAULT 0,
  posts_limit INT DEFAULT 3,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Viral templates (curated library)
CREATE TABLE public.viral_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT,
  template_structure TEXT NOT NULL,
  example_post TEXT,
  variables JSONB,
  avg_engagement_score FLOAT DEFAULT 0,
  times_used INT DEFAULT 0,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community posts
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributed_by UUID REFERENCES public.users(id),
  content TEXT NOT NULL,
  anonymized_content TEXT,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  impressions INT DEFAULT 0,
  engagement_rate FLOAT,
  topic TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User voice profiles
CREATE TABLE public.user_voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  writing_samples TEXT[],
  sample_count INT DEFAULT 0,
  tone TEXT,
  formality_score FLOAT,
  emoji_usage TEXT,
  vocabulary_level TEXT,
  storytelling_style TEXT,
  common_phrases TEXT[],
  full_analysis JSONB,
  embedding VECTOR(1536),
  is_calibrated BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User memory
CREATE TABLE public.user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL,
  key_insights TEXT[],
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated posts
CREATE TABLE public.generated_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  input_topic TEXT,
  input_context TEXT,
  generated_content TEXT NOT NULL,
  variation_type TEXT,
  templates_used UUID[],
  was_posted BOOLEAN DEFAULT FALSE,
  actual_likes INT,
  actual_comments INT,
  actual_impressions INT,
  user_rating INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trending topics
CREATE TABLE public.trending_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  category TEXT,
  suggested_angles TEXT[],
  industries TEXT[],
  relevance_score FLOAT,
  expires_at TIMESTAMP WITH TIME ZONE,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_templates_embedding ON public.viral_templates USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_community_embedding ON public.community_posts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_memory_embedding ON public.user_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Vector search function
CREATE OR REPLACE FUNCTION match_templates(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (id UUID, name TEXT, category TEXT, template_structure TEXT, example_post TEXT, similarity FLOAT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT vt.id, vt.name, vt.category, vt.template_structure, vt.example_post,
         1 - (vt.embedding <=> query_embedding) AS similarity
  FROM public.viral_templates vt
  WHERE 1 - (vt.embedding <=> query_embedding) > match_threshold
  ORDER BY vt.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION match_community_posts(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10
)
RETURNS TABLE (id UUID, content TEXT, engagement_rate FLOAT, topic TEXT, similarity FLOAT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT cp.id, cp.anonymized_content, cp.engagement_rate, cp.topic,
         1 - (cp.embedding <=> query_embedding) AS similarity
  FROM public.community_posts cp
  WHERE cp.is_public = TRUE AND 1 - (cp.embedding <=> query_embedding) > match_threshold
  ORDER BY cp.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION match_user_memory(
  p_user_id UUID,
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 5
)
RETURNS TABLE (id UUID, content TEXT, content_type TEXT, key_insights TEXT[], similarity FLOAT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT um.id, um.content, um.content_type, um.key_insights,
         1 - (um.embedding <=> query_embedding) AS similarity
  FROM public.user_memory um
  WHERE um.user_id = p_user_id
  ORDER BY um.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viral_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own data" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users own voice" ON public.user_voice_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own memory" ON public.user_memory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own posts" ON public.generated_posts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Templates public" ON public.viral_templates FOR SELECT USING (true);
CREATE POLICY "Community public" ON public.community_posts FOR SELECT USING (is_public = true);
CREATE POLICY "Trending public" ON public.trending_topics FOR SELECT USING (true);

-- Auto-create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
