-- Drop existing policies on notifications to avoid conflicts
DROP POLICY IF EXISTS "Allow admin to insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Enable read access for users to their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Enable ALL access for admins" ON public.notifications;

-- Drop incorrect policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;


-- Enable RLS on users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own profile and admins can see all profiles.
CREATE POLICY "Enable read access for users and admins"
ON public.users
FOR SELECT
USING (
  auth.uid() = id OR
  (SELECT (raw_user_meta_data->>'isAdmin')::boolean FROM auth.users WHERE id = auth.uid()) = true
);

-- Policy: Users can update their own profile, and admins can update any profile.
CREATE POLICY "Enable update for users and admins"
ON public.users
FOR UPDATE
USING (
  auth.uid() = id OR
  (SELECT (raw_user_meta_data->>'isAdmin')::boolean FROM auth.users WHERE id = auth.uid()) = true
)
WITH CHECK (
  auth.uid() = id OR
  (SELECT (raw_user_meta_data->>'isAdmin')::boolean FROM auth.users WHERE id = auth.uid()) = true
);


-- Enable RLS for notifications if not already enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own notifications
CREATE POLICY "Enable read access for users to their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = "userId");

-- Policy: Admins can manage all notifications
CREATE POLICY "Enable ALL access for admins"
ON public.notifications
FOR ALL
USING ( (SELECT raw_user_meta_data ->> 'isAdmin' FROM auth.users WHERE id = auth.uid())::boolean = true )
WITH CHECK ( (SELECT raw_user_meta_data ->> 'isAdmin' FROM auth.users WHERE id = auth.uid())::boolean = true );
