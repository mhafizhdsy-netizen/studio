
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// We will no longer export a singleton client.
// Instead, we will create clients on demand or manage them within a context.
export { createClient };

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn("Supabase URL or Anon Key is missing. Database features will be disabled.");
}

export const supabase: SupabaseClient = supabaseInstance as SupabaseClient;


/**
 * Sets the authentication token for the Supabase client.
 * This should be called whenever the Firebase user's auth state changes.
 * @param token The Firebase JWT token, or null to sign out.
 */
export const setSupabaseAuthToken = (token: string | null) => {
  if (supabaseInstance) {
    if (token) {
        supabaseInstance.auth.setSession({ access_token: token, refresh_token: '' });
    } else {
      // When the user logs out from Firebase, we sign out from Supabase as well.
      // This clears the JWT from the client instance.
      supabaseInstance.auth.signOut();
    }
  }
};


/**
 * Mengunggah file ke Supabase Storage.
 * @param file File yang akan diunggah.
 * @param bucket Nama bucket di Supabase.
 * @param path Path di dalam bucket (termasuk nama file).
 * @param onProgress Callback untuk melacak progres unggahan (0-100).
 * @returns URL publik dari file yang diunggah.
 */
export async function uploadFileToSupabase(
  file: File,
  bucket: string,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase client is not initialized.");
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true, // Timpa file jika sudah ada
    });

  if (error) {
    console.error("Supabase upload error:", error);
    throw error;
  }

  // Karena Supabase JS v2 tidak memiliki event progress bawaan,
  // kita akan memanggil onProgress dengan 100% saat selesai.
  if (onProgress) {
    onProgress(100);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  if (!publicUrlData) {
    throw new Error("Could not get public URL for the uploaded file.");
  }
  
  return publicUrlData.publicUrl;
}
