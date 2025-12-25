-- Create a specific Bucket for Documents
insert into storage.buckets (id, name)
values ('documents', 'documents');

-- Set up Access Policies (RLS) for the Storage Bucket
-- 1. Allow authenticated users to upload their own files
create policy "Authenticated users can upload documents"
on storage.objects for insert
with check ( bucket_id = 'documents' and auth.uid() = owner );

-- 2. Allow users to view/download their own files
create policy "Users can view their own documents"
on storage.objects for select
using ( bucket_id = 'documents' and auth.uid() = owner );

-- 3. Allow users to delete their own files
create policy "Users can delete their own documents"
on storage.objects for delete
using ( bucket_id = 'documents' and auth.uid() = owner );

-- Create a Database Table to store Document Metadata
create table public.user_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  type text not null,
  expiry_date date not null,
  file_url text,      -- The public or signed URL
  file_path text,     -- The internal storage path (needed for deletion)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on the table
alter table public.user_documents enable row level security;

-- Policies for the Table
create policy "Users can insert their own documents"
on public.user_documents for insert
with check ( auth.uid() = user_id );

create policy "Users can view their own documents"
on public.user_documents for select
using ( auth.uid() = user_id );

create policy "Users can delete their own documents"
on public.user_documents for delete
using ( auth.uid() = user_id );
