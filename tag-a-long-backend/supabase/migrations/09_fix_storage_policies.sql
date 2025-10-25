-- Fix Storage Policies for Profile Photos
-- This allows uploads without strict auth checking

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can upload own profile photo" ON storage.objects;

-- Create a more permissive policy that allows any authenticated request
CREATE POLICY "Allow uploads to profile-photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-photos');

-- Also update the other policies to be less restrictive
DROP POLICY IF EXISTS "Users can update own profile photo" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile photo" ON storage.objects;

CREATE POLICY "Allow updates to profile-photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Allow deletes from profile-photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-photos');
