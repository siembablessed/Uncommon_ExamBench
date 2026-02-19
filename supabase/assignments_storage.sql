-- Create a new storage bucket for assignments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assignments', 'assignments', true);

-- Allow authenticated users to upload files to the 'assignments' bucket
CREATE POLICY "Authenticated users can upload assignment files"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'assignments'
);

-- Allow authenticated users to view files in the 'assignments' bucket
CREATE POLICY "Authenticated users can view assignment files"
ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'assignments'
);

-- Allow users to update their own files (optional, effectively overwrite)
CREATE POLICY "Users can update their own assignment files"
ON storage.objects FOR UPDATE TO authenticated USING (
    bucket_id = 'assignments' AND owner = auth.uid()
) WITH CHECK (
    bucket_id = 'assignments' AND owner = auth.uid()
);
