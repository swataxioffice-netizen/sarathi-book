-- Add a 'settings' column to the 'profiles' table to store user preferences
alter table public.profiles 
add column if not exists settings jsonb default '{}'::jsonb;

-- Ensure the profiles table has necessary columns if not already present (failsafe)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  avatar_url text,
  phone text,
  updated_at timestamp with time zone,
  settings jsonb default '{}'::jsonb
);

-- Enable RLS (if not already enabled)
alter table public.profiles enable row level security;

-- Policies for Profiles (if not already present)
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );
