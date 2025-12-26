-- 1. Create the Storage Bucket (if it doesn't exist)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do update set public = true;

-- 2. Storage Policies (Robust version)
-- Allow authenticated users to upload to their own folder (user_id/filename)
drop policy if exists "Users can upload their own documents" on storage.objects;
create policy "Users can upload their own documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own documents
drop policy if exists "Users can view their own documents" on storage.objects;
create policy "Users can view their own documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own documents
drop policy if exists "Users can delete their own documents" on storage.objects;
create policy "Users can delete their own documents"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Database Table (Metadata)
create table if not exists public.user_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  type text not null,
  expiry_date date not null,
  file_url text,
  file_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Database Policies
alter table public.user_documents enable row level security;

drop policy if exists "Users can insert their own documents" on public.user_documents;
create policy "Users can insert their own documents"
on public.user_documents for insert
to authenticated
with check ( auth.uid() = user_id );

drop policy if exists "Users can select their own documents" on public.user_documents;
create policy "Users can select their own documents"
on public.user_documents for select
to authenticated
using ( auth.uid() = user_id );

drop policy if exists "Users can delete their own documents" on public.user_documents;
create policy "Users can delete their own documents"
on public.user_documents for delete
to authenticated
using ( auth.uid() = user_id );
