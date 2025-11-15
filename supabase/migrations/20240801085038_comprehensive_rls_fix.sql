
-- Hapus kebijakan lama yang mungkin menyebabkan konflik (Jalankan jika ada)
DROP POLICY IF EXISTS "Allow admin to insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow admin to manage all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow individual user to read their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow admins to read all user profiles" ON public.users;
DROP POLICY IF EXISTS "Enable all access for admins" ON public.reports;
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Allow individual user to read their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow individual user to update their own profile" ON public.users;


-- Aktifkan RLS untuk tabel-tabel penting
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Kebijakan untuk Tabel Pengguna (users)
-- 1. Izinkan admin untuk melihat semua data pengguna.
CREATE POLICY "Allow admins to read all user profiles"
ON public.users
FOR SELECT
TO authenticated
USING (
  (SELECT raw_user_meta_data ->> 'isAdmin' FROM auth.users WHERE id = auth.uid())::boolean = true
);

-- 2. Izinkan pengguna untuk melihat profil mereka sendiri.
CREATE POLICY "Allow individual user to read their own profile"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- 3. Izinkan pengguna untuk memperbarui profil mereka sendiri.
CREATE POLICY "Allow individual user to update their own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
    auth.uid() = id
);


-- Kebijakan untuk Tabel Notifikasi (notifications)
-- 1. Izinkan admin untuk melakukan semua aksi (termasuk INSERT).
CREATE POLICY "Allow admin to manage all notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (
  (SELECT raw_user_meta_data ->> 'isAdmin' FROM auth.users WHERE id = auth.uid())::boolean = true
)
WITH CHECK (
  (SELECT raw_user_meta_data ->> 'isAdmin' FROM auth.users WHERE id = auth.uid())::boolean = true
);

-- 2. Izinkan pengguna untuk membaca notifikasi mereka sendiri.
CREATE POLICY "Allow individual user to read their notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  auth.uid() = "userId"
);


-- Kebijakan untuk Tabel Laporan (reports)
-- 1. Izinkan admin untuk mengakses semua laporan.
CREATE POLICY "Enable all access for admins"
ON public.reports
FOR ALL
TO authenticated
USING (
  (SELECT raw_user_meta_data ->> 'isAdmin' FROM auth.users WHERE id = auth.uid())::boolean = true
)
WITH CHECK (
  (SELECT raw_user_meta_data ->> 'isAdmin' FROM auth.users WHERE id = auth.uid())::boolean = true
);

-- 2. Izinkan pengguna yang login untuk membuat laporan baru.
CREATE POLICY "Users can create reports"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = "reporterUserId"
);
