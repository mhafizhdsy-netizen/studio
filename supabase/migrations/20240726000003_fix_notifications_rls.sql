-- 1. Hapus kebijakan lama yang salah jika ada
DROP POLICY IF EXISTS "Allow admin to insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow users to read their own notifications" ON public.notifications;

-- 2. Pastikan RLS diaktifkan
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Buat kebijakan baru yang MENGIZINKAN ADMIN melakukan SEMUA AKSI
CREATE POLICY "Allow admin full access to notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (
  (SELECT raw_user_meta_data ->> 'isAdmin' FROM auth.users WHERE id = auth.uid())::boolean = true
)
WITH CHECK (
  (SELECT raw_user_meta_data ->> 'isAdmin' FROM auth.users WHERE id = auth.uid())::boolean = true
);

-- 4. Buat kebijakan baru yang MENGIZINKAN PENGGUNA untuk MEMBACA notifikasi mereka sendiri
CREATE POLICY "Allow users to read their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  "userId" = auth.uid()
);
