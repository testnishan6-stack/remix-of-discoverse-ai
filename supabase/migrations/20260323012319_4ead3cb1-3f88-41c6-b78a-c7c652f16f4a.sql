CREATE POLICY "Authenticated users can insert own models"
ON public.models FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = uploaded_by);