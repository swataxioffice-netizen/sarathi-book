-- COMPREHENSIVE ADMIN REPAIR SCRIPT
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Ensure 'profiles' table has a 'role' column (useful for future-proofing)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Set the main admin account role
-- Using the email defined in AuthContext.tsx
UPDATE public.profiles SET role = 'admin' WHERE email = 'swa.taxioffice@gmail.com';

-- 3. Fix 'user_documents' SELECT policy
-- Allow the admin and the owner to view documents
DROP POLICY IF EXISTS "Admin and owners can view documents" ON public.user_documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON public.user_documents;

CREATE POLICY "Admin and owners can view documents"
ON public.user_documents FOR SELECT
TO authenticated
USING (
  auth.email() = 'swa.taxioffice@gmail.com' 
  OR 
  auth.uid() = user_id
);

-- 4. Fix 'admin_analytics' SELECT policy
-- Allow the admin to view all activity logs
DROP POLICY IF EXISTS "Allow Admin to view all logs" ON public.admin_analytics;
CREATE POLICY "Allow Admin to view all logs"
ON public.admin_analytics FOR SELECT
TO authenticated
USING (
  auth.email() = 'swa.taxioffice@gmail.com' 
  OR 
  auth.uid() = user_id
);

-- 5. Fix 'profiles' SELECT policy
-- Ensure admin can list all profiles for the admin panel
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING ( true );

-- 6. Ensure the admin_analytics table exists and is initialized
CREATE TABLE IF NOT EXISTS public.admin_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Add Index for performance
CREATE INDEX IF NOT EXISTS idx_admin_analytics_created_at ON public.admin_analytics(created_at DESC);

-- 8. Enable Realtime for admin_analytics (used in AdminPanel.tsx)
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_analytics;
-- Note: If the above fails because it's already added, ignore the error or use:
-- DROP PUBLICATION IF EXISTS supabase_realtime;
-- CREATE PUBLICATION supabase_realtime FOR TABLE public.admin_analytics, public.notifications;
