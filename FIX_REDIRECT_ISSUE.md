# Fix: Staying on SarathiBook.com after Login

The issue where you are redirected to `vercel.app` happens because **Supabase** (your database) does not yet know that `sarathibook.com` is a trusted website. It defaults to the safe "Site URL" (Vercel) for security.

## How to Fix (Takes 30 seconds)

1.  Go to your **Supabase Dashboard** (https://supabase.com/dashboard).
2.  Select your Project (**Cab Driver** / Sarathi).
3.  On the left sidebar, click **Authentication** -> **URL Configuration**.
4.  Look for **"Redirect URLs"**.
5.  Click **"Add URL"** and add **BOTH** of these:
    *   `https://www.sarathibook.com`
    *   `https://sarathibook.com`
6.  Click **Save**.

## Why this works
Your app code is already sending the correct address (`window.location.origin`). Once you add these URLs to the "Allow List", Supabase will accept the request and send the user back to the correct domain instead of forcing them to Vercel.
