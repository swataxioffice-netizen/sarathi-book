-- Bulk Fix for Missing Pro Subscriptions
-- INSTRUCTIONS:
-- 1. Export the list of successful payments from your Razorpay Dashboard.
-- 2. Copy the email addresses of the users who paid but are not Pro.
-- 3. Paste them into the IN list below, inside single quotes, separated by commas.

UPDATE public.profiles
SET settings = settings || '{"isPremium": true, "plan": "pro"}'::jsonb
WHERE email IN (
    'saravn.ent@gmail.com',
    -- PASTE ADDITIONAL EMAILS HERE, for example:
    -- 'another.user@gmail.com',
    -- 'driver.three@gmail.com'
    'place_holder@example.com' -- Remove this line when adding real emails
);

-- Verification Query to see the updated users
SELECT email, settings->>'plan' as plan, settings->>'isPremium' as is_premium 
FROM public.profiles 
WHERE settings->>'isPremium' = 'true';
