-- 1. Ensure the 'profiles' table has all necessary columns
alter table public.profiles 
add column if not exists avatar_url text;

-- 2. Now define the function safely
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

-- 3. Re-create the Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Backfill Missing Users (Safe Version)
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

-- 5. Fix Permissions
drop policy if exists "Authenticated users can read all profiles" on public.profiles;
create policy "Authenticated users can read all profiles"
  on public.profiles for select
  to authenticated
  using ( true );
