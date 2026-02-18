-- Create the exams bucket if it doesn't exist (idempotent setup is hard in SQL for storage, relying on policies)
-- Note: You likely need to create the 'exams' bucket in the Supabase Dashboard if it doesn't exist.

-- Allow authenticated users to view exam files (Students need to see them)
create policy "Authenticated users can view exam files."
  on storage.objects for select
  using ( bucket_id = 'exams' and auth.role() = 'authenticated' );

-- Allow users to upload exams to their own folder
create policy "Users can upload exam files to their own folder."
  on storage.objects for insert
  with check ( 
    bucket_id = 'exams' 
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own exam files
create policy "Users can update their own exam files."
  on storage.objects for update
  using ( 
    bucket_id = 'exams' 
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own exam files
create policy "Users can delete their own exam files."
  on storage.objects for delete
  using ( 
    bucket_id = 'exams' 
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
