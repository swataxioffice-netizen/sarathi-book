-- SQL Migration to backfill 'plan' for existing premium members
-- Run this in Supabase SQL Editor

UPDATE public.profiles 
SET settings = settings || '{"plan": "pro"}'::jsonb 
WHERE 
    (settings->>'isPremium')::boolean = true 
    AND (
        settings->>'plan' IS NULL 
        OR settings->>'plan' = 'free'
    );

-- Verification Query
SELECT id, email, settings->>'isPremium' as is_premium, settings->>'plan' as plan 
FROM public.profiles 
WHERE (settings->>'isPremium')::boolean = true;
