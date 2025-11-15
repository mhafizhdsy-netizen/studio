
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
  path: string,
  onProgress?: (progress: number) => void
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


/**
 * Deletes a file from Supabase Storage based on its public URL.
 * @param bucket The name of the bucket in Supabase.
 * @param publicUrl The public URL of the file to delete.
 * @returns True if successful, false otherwise.
 */
export async function deleteFileFromSupabase(bucket: string, publicUrl: string): Promise<boolean> {
    if (!publicUrl) return false;

    try {
        const urlParts = publicUrl.split('/');
        const filePath = urlParts.slice(urlParts.indexOf(bucket) + 1).join('/');

        if (!filePath) {
            console.warn("Could not determine file path from URL:", publicUrl);
            return false;
        }

        const { error } = await supabase.storage.from(bucket).remove([filePath]);

        if (error) {
            // It's often okay if the file doesn't exist (e.g., already deleted),
            // so we only log more critical errors.
            if (error.message !== 'The resource was not found') {
                 console.error("Supabase deletion error:", error);
            }
            return false;
        }
        
        return true;

    } catch (e) {
        console.error("Error parsing URL for file deletion:", e);
        return false;
    }
}
