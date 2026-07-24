-- SQL Migration to convert all profiles to unlimited free (super/premium) plan
-- Run this in Supabase SQL Editor

UPDATE public.profiles 
SET settings = COALESCE(settings, '{}'::jsonb) || '{"plan": "super", "isPremium": true}'::jsonb;

-- Verification Query
SELECT id, email, settings->>'isPremium' as is_premium, settings->>'plan' as plan 
FROM public.profiles 
LIMIT 10;
