-- SQL Query to find all users who were restored to Pro based on legacy 'isPremium' flag
SELECT 
    id, 
    email, 
    name, 
    settings->>'plan' as current_plan,
    settings->>'isPremium' as was_premium_legacy
FROM public.profiles 
WHERE 
    (settings->>'isPremium')::boolean = true;
