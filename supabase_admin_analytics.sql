-- Create the admin_analytics table
CREATE TABLE IF NOT EXISTS public.admin_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.admin_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts/errors
DROP POLICY IF EXISTS "Allow authenticated users to insert logs" ON public.admin_analytics;
DROP POLICY IF EXISTS "Allow anonymous users to insert logs" ON public.admin_analytics;
DROP POLICY IF EXISTS "Allow service_role to do everything" ON public.admin_analytics;
DROP POLICY IF EXISTS "Allow users to view own logs" ON public.admin_analytics;
DROP POLICY IF EXISTS "Allow Admin to view all logs" ON public.admin_analytics;

-- Policy: Allow authenticated users to insert logs
CREATE POLICY "Allow authenticated users to insert logs"
ON public.admin_analytics
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow anonymous users to insert logs (for calculator usage by non-logged in users if applicable)
CREATE POLICY "Allow anonymous users to insert logs"
ON public.admin_analytics
FOR INSERT
TO anon
WITH CHECK (true);

-- Policy: Allow service_role (Admin) to do everything
CREATE POLICY "Allow service_role to do everything"
ON public.admin_analytics
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow Admin user to view ALL logs, and users to view their own
CREATE POLICY "Allow Admin to view all logs"
ON public.admin_analytics
FOR SELECT
TO authenticated
USING (
  auth.email() = 'swa.taxioffice@gmail.com' 
  OR 
  auth.uid() = user_id
);


-- Create an index on created_at for faster sorting/filtering
CREATE INDEX IF NOT EXISTS idx_admin_analytics_created_at ON public.admin_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_analytics_event_type ON public.admin_analytics(event_type);
