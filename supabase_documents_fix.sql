-- FIX: Add missing UPDATE policy for user_documents
-- Run this in your Supabase SQL Editor

-- 1. Enable UPDATE policy
drop policy if exists "Users can update their own documents" on public.user_documents;

create policy "Users can update their own documents"
on public.user_documents for update
to authenticated
using ( auth.uid() = user_id )
with check ( auth.uid() = user_id );

-- 2. Optional: Add updated_at column if you want to track updates in the future
-- alter table public.user_documents add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());
