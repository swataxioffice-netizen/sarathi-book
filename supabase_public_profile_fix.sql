-- EMERGENCY FIX: Public Profile Visibility
-- This script ensures that anyone (even unsigned-in customers) can view driver profiles.
-- Without this, the public profile page will stay stuck on the loading spinner.

-- 1. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop any old policies that might be restrictive
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- 3. Create the "Allow Public Read" policy
-- This allows anyone to fetch the 'settings', 'id', and 'driver_code' for the public profile page.
CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT
TO anon, authenticated
USING (true);

-- 4. Re-add the "Users can manage their own profile" policies
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
