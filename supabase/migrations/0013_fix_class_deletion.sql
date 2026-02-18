-- Add DELETE policy for classes
create policy "Instructors can delete their own classes"
  on public.classes for delete
  using ( auth.uid() = instructor_id );

-- Update enrollments to cascade delete
alter table public.enrollments
  drop constraint if exists enrollments_class_id_fkey,
  add constraint enrollments_class_id_fkey
  foreign key (class_id)
  references public.classes(id)
  on delete cascade;

-- Update exams to cascade delete
alter table public.exams
  drop constraint if exists exams_class_id_fkey,
  add constraint exams_class_id_fkey
  foreign key (class_id)
  references public.classes(id)
  on delete cascade;

-- Update submissions to cascade delete (needed when exams are deleted)
alter table public.submissions
  drop constraint if exists submissions_exam_id_fkey,
  add constraint submissions_exam_id_fkey
  foreign key (exam_id)
  references public.exams(id)
  on delete cascade;
