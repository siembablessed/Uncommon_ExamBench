-- Allow instructors to view enrollments for their classes
-- Drop the existing policy if it's too restrictive or add a new one. 
-- The existing policy "Enrollments viewable by members." only checks auth.uid() = user_id.

create policy "Instructors can view enrollments for their classes."
  on enrollments for select
  using (
    exists (
      select 1 from classes
      where classes.id = enrollments.class_id
      and classes.instructor_id = auth.uid()
    )
  );
