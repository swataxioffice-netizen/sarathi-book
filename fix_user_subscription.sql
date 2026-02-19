-- Admin Restore Script for Missing Subscription
-- Issue: Payment was successful (Razorpay) but the profile was not updated due to a client-side race condition.
-- User Email: saravn.ent@gmail.com
-- Ref ID (from screenshot): pay_SHdCrCZg3i8TR0

-- Fix: Manually update the user's profile to 'pro' status.

UPDATE public.profiles
SET settings = settings || '{"isPremium": true, "plan": "pro"}'::jsonb
WHERE email = 'saravn.ent@gmail.com';

-- Verify the update
SELECT email, settings->>'plan' as plan, settings->>'isPremium' as is_premium 
FROM public.profiles 
WHERE email = 'saravn.ent@gmail.com';
