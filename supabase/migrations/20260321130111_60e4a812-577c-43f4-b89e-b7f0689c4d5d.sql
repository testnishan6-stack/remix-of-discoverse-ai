
-- Add tools/capabilities columns to ai_agents
ALTER TABLE public.ai_agents 
  ADD COLUMN IF NOT EXISTS tools_enabled jsonb DEFAULT '{"image_generation": false, "pdf_maker": false, "pptx_maker": false, "web_search": false, "youtube_summary": false}'::jsonb,
  ADD COLUMN IF NOT EXISTS image_gen_style text DEFAULT 'photorealistic',
  ADD COLUMN IF NOT EXISTS is_maintenance boolean DEFAULT false;

-- Create avatar storage bucket for agents
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "Users can delete own avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');
