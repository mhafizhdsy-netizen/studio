
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a single, exportable Supabase client
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

/**
 * Uploads a file to Supabase Storage with progress tracking.
 * @param file The file to upload.
 * @param bucket The name of the bucket in Supabase.
 * @param path The path within the bucket (including the file name).
 * @param onProgress Callback to track upload progress (0-100).
 * @returns The public URL of the uploaded file.
 */
export function uploadFileToSupabase(
  file: File,
  bucket: string,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

    xhr.open("POST", uploadUrl, true);
    
    // Set Supabase headers
    xhr.setRequestHeader("apikey", supabaseAnonKey!);
    xhr.setRequestHeader("Authorization", `Bearer ${supabaseAnonKey}`);
    xhr.setRequestHeader("x-upsert", "true"); // upsert: true

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Construct the public URL
        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(path);

        if (!publicUrlData) {
          reject(new Error("Could not get public URL for the uploaded file."));
        } else {
          resolve(publicUrlData.publicUrl);
        }
      } else {
        try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.message || 'File upload failed'));
        } catch (e) {
            reject(new Error(`File upload failed with status ${xhr.status}`));
        }
      }
    };
    
    xhr.onerror = () => {
        reject(new Error("Network error occurred during file upload."));
    };

    xhr.send(file);
  });
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
