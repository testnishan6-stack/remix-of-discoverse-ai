
-- AI Agents table for admin-configurable personalized chatbots
CREATE TABLE public.ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  avatar_url text,
  personality text NOT NULL DEFAULT 'warm, friendly Nepali science guide',
  system_prompt text NOT NULL,
  greeting_message text NOT NULL DEFAULT 'Namaste! Ma timro learning companion ho. K sikna chahanchau aaja?',
  language_style text NOT NULL DEFAULT 'romanized_nepali',
  knowledge_areas text[] DEFAULT '{}'::text[],
  research_papers text[] DEFAULT '{}'::text[],
  voice_id text DEFAULT 'EXAVITQu4vr4xnSDxMaL',
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

-- Only admins can manage agents
CREATE POLICY "Admins can manage agents" ON public.ai_agents
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Published agents are readable by all authenticated users
CREATE POLICY "Published agents readable by all" ON public.ai_agents
  FOR SELECT TO authenticated
  USING (is_published = true);

-- Trigger for updated_at
CREATE TRIGGER update_ai_agents_updated_at
  BEFORE UPDATE ON public.ai_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-assign admin role to geetxteam@gmail.com on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.raw_user_meta_data->>'avatar_url');
  
  -- Assign admin role to geetxteam@gmail.com, student to everyone else
  IF NEW.email = 'geetxteam@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  END IF;
  
  RETURN NEW;
END;
$function$;
