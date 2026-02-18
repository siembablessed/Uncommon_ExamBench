-- Add missing policies for exams table

create policy "Instructors can update their own exams."
  on exams for update
  using ( created_by = auth.uid() );

create policy "Instructors can delete their own exams."
  on exams for delete
  using ( created_by = auth.uid() );
