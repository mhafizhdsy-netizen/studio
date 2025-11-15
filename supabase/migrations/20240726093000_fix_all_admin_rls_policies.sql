
-- Step 1: Ensure RLS is enabled on all relevant tables.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop old, potentially conflicting policies to start clean.
DROP POLICY IF EXISTS "Allow admin to select all users" ON public.users;
DROP POLICY IF EXISTS "Allow individual user access to their own data" ON public.users;
DROP POLICY IF EXISTS "Allow admin to insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow user to read their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow admin to manage reports" ON public.reports;
DROP POLICY IF EXISTS "Allow authenticated users to create reports" ON public.reports;

-- Step 3: Create correct policies for the 'users' table.

-- Policy 3.1: Admins can see all user data.
CREATE POLICY "Allow admin to select all users"
ON public.users
FOR SELECT
TO authenticated
USING (
  (get_my_claim('user_metadata'::text) ->> 'isAdmin'::text)::boolean = true
);

-- Policy 3.2: Users can view their own data.
CREATE POLICY "Allow individual user access to their own data"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);


-- Step 4: Create correct policies for the 'notifications' table.

-- Policy 4.1: Admins can insert any notification.
CREATE POLICY "Allow admin to insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  (get_my_claim('user_metadata'::text) ->> 'isAdmin'::text)::boolean = true
);

-- Policy 4.2: Users can read and update their own notifications.
CREATE POLICY "Allow user to read and update their own notifications"
ON public.notifications
FOR SELECT, UPDATE
TO authenticated
USING (
  auth.uid() = "userId"
);


-- Step 5: Create correct policies for the 'reports' table.

-- Policy 5.1: Admins can perform any action on reports.
CREATE POLICY "Allow admin to manage reports"
ON public.reports
FOR ALL
TO authenticated
USING (
  (get_my_claim('user_metadata'::text) ->> 'isAdmin'::text)::boolean = true
)
WITH CHECK (
  (get_my_claim('user_metadata'::text) ->> 'isAdmin'::text)::boolean = true
);

-- Policy 5.2: Any authenticated user can create a report.
CREATE POLICY "Allow authenticated users to create reports"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = "reporterUserId"
);
