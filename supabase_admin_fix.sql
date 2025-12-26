-- RUTHLESS ADMIN REPAIR SCRIPT
-- 1. Create a function that runs automatically whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url, updated_at)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- 2. Create the Trigger to fire this function on new User Creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. FATAL FIX: Backfill ALL missing users that already exist in auth.users but not in profiles
insert into public.profiles (id, email, name, avatar_url, updated_at)
select 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url', 
  now()
from auth.users
on conflict (id) do update 
set 
  email = excluded.email,
  name = excluded.name,
  avatar_url = excluded.avatar_url;

-- 4. Verify Policy - Ensure Admin has FULL ACCESS to read all profiles
-- (Assuming RLS is effectively permissive or Admin is handled, but let's ensure public readout for admin panel for now)
drop policy if exists "Admin can see everyone" on public.profiles;
-- For now, ensure authenticated users can read all profiles (needed for Admin Panel to list them)
-- Or better, if simple RLS:
create policy "Authenticated users can read all profiles"
  on public.profiles for select
  to authenticated
  using ( true );
