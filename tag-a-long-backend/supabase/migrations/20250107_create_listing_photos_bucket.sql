-- Create listing-photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-photos',
  'listing-photos',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read files
CREATE POLICY "Public Access for listing photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listing-photos');

-- Allow authenticated users to upload their own listing photos
CREATE POLICY "Users can upload listing photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listing-photos');

-- Allow users to update their own listing photos
CREATE POLICY "Users can update their listing photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'listing-photos');

-- Allow users to delete their own listing photos
CREATE POLICY "Users can delete their listing photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'listing-photos');
