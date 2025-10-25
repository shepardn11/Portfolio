-- Add Profile Photo Gallery
-- Migration 10: Add support for multiple profile photos (up to 5 additional photos)

-- Add photo_gallery column to profiles table
-- Stores array of photo URLs (max 5)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS photo_gallery TEXT[] DEFAULT '{}';

-- Add comment
COMMENT ON COLUMN profiles.photo_gallery IS 'Array of additional profile photo URLs (max 5 photos)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_photo_gallery ON profiles USING GIN (photo_gallery);

-- Add constraint to limit gallery to 5 photos
ALTER TABLE profiles
ADD CONSTRAINT check_gallery_size CHECK (array_length(photo_gallery, 1) <= 5 OR photo_gallery = '{}');
