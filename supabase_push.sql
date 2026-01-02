-- Add push_subscription column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS push_subscription jsonb;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.push_subscription IS 'Web Push API subscription object for system notifications';
