-- Allow instructors to enroll students in their own classes
create policy "Instructors can enroll students in their classes."
  on enrollments for insert
  with check ( 
    exists (
      select 1 from classes
      where classes.id = enrollments.class_id
      and classes.instructor_id = auth.uid()
    )
  );

-- Also allow instructors to remove students from their classes
create policy "Instructors can remove students from their classes."
  on enrollments for delete
  using (
    exists (
      select 1 from classes
      where classes.id = enrollments.class_id
      and classes.instructor_id = auth.uid()
    )
  );
