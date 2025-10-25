// Image Upload Utility - Upload images to Supabase Storage
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://cwrpiqlimjrcjnvvtyng.supabase.co';
// Using service role key for uploads - bypasses RLS
// TODO: Move to backend endpoint in production
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cnBpcWxpbWpyY2pudnZ0eW5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4Mzg5NCwiZXhwIjoyMDc2NTU5ODk0fQ.SQXvw6pqlvM6m3rxQWjDd_3qjS0RxPvLrKU9G-cnR-w';

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

/**
 * Upload image to Supabase Storage
 * @param uri - Local file URI from image picker
 * @param userId - User ID for folder organization
 * @param bucketName - Storage bucket name (default: 'profile-photos')
 * @returns Public URL of uploaded image
 */
export const uploadImage = async (
  uri: string,
  userId: string,
  bucketName: string = 'profile-photos'
): Promise<string> => {
  try {
    console.log('DEBUG: Starting image upload');
    console.log('DEBUG: URI:', uri);
    console.log('DEBUG: User ID:', userId);
    console.log('DEBUG: Bucket:', bucketName);

    // Fetch the image as a blob
    console.log('DEBUG: Fetching image as blob...');
    const response = await fetch(uri);
    const blob = await response.blob();
    console.log('DEBUG: Blob size:', blob.size, 'type:', blob.type);

    // Extract extension from MIME type (e.g., "image/png" -> "png")
    const fileExt = blob.type.split('/')[1] || 'jpg';

    // Generate unique filename
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    console.log('DEBUG: File name:', fileName);

    // Upload to Supabase Storage
    // Using anon key, which is allowed for authenticated users via RLS policies
    console.log('DEBUG: Uploading to Supabase Storage with anon key...');
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, blob, {
        contentType: blob.type,
        upsert: false,
      });

    if (error) {
      console.error('DEBUG: Supabase upload error:', error);
      throw new Error(error.message);
    }

    console.log('DEBUG: Upload successful, data:', data);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    console.log('DEBUG: Public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('DEBUG: Image upload error:', error);
    throw error;
  }
};

/**
 * Delete image from Supabase Storage
 * @param filePath - Path to file in storage (e.g., 'userId/filename.jpg')
 * @param bucketName - Storage bucket name
 */
export const deleteImage = async (
  filePath: string,
  bucketName: string = 'profile-photos'
): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Image delete error:', error);
    throw error;
  }
};
