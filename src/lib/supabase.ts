
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or Anon Key is missing. Storage features will be disabled.");
}

// Inisialisasi Supabase client hanya jika URL dan kunci tersedia
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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
