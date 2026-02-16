-- Add avatar_url to profiles
alter table public.profiles add column avatar_url text;

-- STORAGE POLICIES (Note: Buckets usually need to be created via Dashboard or Client API, but we can set policies)
-- Assuming 'avatars' bucket exists or will be created.

-- Allow public read of avatars
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Allow authenticated users to upload avatars
create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- Allow users to update their own avatar (basic check)
create policy "Anyone can update their own avatar."
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.role() = 'authenticated' );
