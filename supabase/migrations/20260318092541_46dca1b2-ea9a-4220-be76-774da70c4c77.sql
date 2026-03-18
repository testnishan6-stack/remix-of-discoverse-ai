
-- Create roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  role_default TEXT DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Admins can manage roles
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3D Models table
CREATE TABLE public.models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL DEFAULT 'biology',
  tier INT NOT NULL DEFAULT 2 CHECK (tier BETWEEN 1 AND 3),
  file_url TEXT NOT NULL,
  file_format TEXT NOT NULL DEFAULT 'glb',
  file_size_bytes BIGINT,
  named_parts TEXT[] DEFAULT '{}',
  keywords_en TEXT[] DEFAULT '{}',
  keywords_hi TEXT[] DEFAULT '{}',
  keywords_ne TEXT[] DEFAULT '{}',
  ncert_chapters TEXT[] DEFAULT '{}',
  class_levels INT[] DEFAULT '{}',
  viral_score INT DEFAULT 50 CHECK (viral_score BETWEEN 1 AND 100),
  quality_rating INT DEFAULT 3 CHECK (quality_rating BETWEEN 1 AND 5),
  source TEXT,
  license TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published models viewable by all" ON public.models FOR SELECT USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert models" ON public.models FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update models" ON public.models FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete models" ON public.models FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Simulation cache
CREATE TABLE public.simulation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'en',
  ai_response JSONB NOT NULL,
  serve_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(model_id, language)
);

ALTER TABLE public.simulation_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cache readable by all" ON public.simulation_cache FOR SELECT USING (true);
CREATE POLICY "Admins can manage cache" ON public.simulation_cache FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User library (saved simulations)
CREATE TABLE public.user_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  last_step INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, model_id)
);

ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own library" ON public.user_library FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Usage analytics
CREATE TABLE public.usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES public.models(id) ON DELETE SET NULL,
  query_text TEXT,
  language TEXT DEFAULT 'en',
  country TEXT,
  session_duration_ms BIGINT,
  last_step_viewed INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Analytics insertable by all auth" ON public.usage_analytics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can read analytics" ON public.usage_analytics FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.raw_user_meta_data->>'avatar_url');
  
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON public.models FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_simulation_cache_updated_at BEFORE UPDATE ON public.simulation_cache FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for 3D models
INSERT INTO storage.buckets (id, name, public) VALUES ('models', 'models', true);

CREATE POLICY "Model files publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'models');
CREATE POLICY "Admins can upload models" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'models' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete model files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'models' AND public.has_role(auth.uid(), 'admin'));

-- Full text search index
CREATE INDEX idx_models_keywords_en ON public.models USING GIN(keywords_en);
CREATE INDEX idx_models_keywords_hi ON public.models USING GIN(keywords_hi);
CREATE INDEX idx_models_slug ON public.models(slug);
CREATE INDEX idx_models_subject ON public.models(subject);
CREATE INDEX idx_models_status ON public.models(status);
