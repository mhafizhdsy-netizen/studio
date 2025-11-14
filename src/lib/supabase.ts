
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a single, exportable Supabase client
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

/**
 * Uploads a file to Supabase Storage.
 * @param file The file to upload.
 * @param bucket The name of the bucket in Supabase.
 * @param path The path within the bucket (including the file name).
 * @param onProgress Callback to track upload progress (0-100).
 * @returns The public URL of the uploaded file.
 */
export async function uploadFileToSupabase(
  file: File,
  bucket: string,
  path: string
): Promise<string> {

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true, // Overwrite file if it already exists
    });

  if (error) {
    console.error("Supabase upload error:", error);
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  if (!publicUrlData) {
    throw new Error("Could not get public URL for the uploaded file.");
  }
  
  return publicUrlData.publicUrl;
}
