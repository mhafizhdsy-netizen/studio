-- supabase/migrations/20240726100000_add_rls_for_admin_notifications.sql

-- Enable RLS on the notifications table if it's not already enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "Allow admin to insert notifications" ON public.notifications;

-- Create a new policy that allows users with the 'admin' custom claim to insert into the notifications table.
-- We check this by querying the users table for the isAdmin flag.
CREATE POLICY "Allow admin to insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  (get_my_claim('is_admin')::boolean) = true
);

-- Optional: Add policies for users to read their own notifications
DROP POLICY IF EXISTS "Allow individual read access" ON public.notifications;
CREATE POLICY "Allow individual read access"
ON public.notifications FOR SELECT
USING (auth.uid() = "userId");
