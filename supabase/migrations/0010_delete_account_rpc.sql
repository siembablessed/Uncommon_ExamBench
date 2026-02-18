-- Create a function to allow users to delete their own account
create or replace function public.delete_account()
returns void as $$
begin
  -- Delete the user from auth.users
  -- This will cascade to public.profiles if we set up the constraint correctly
  -- But usually we need to delete from profiles first if auth.users is the parent
  -- Actually, profiles references auth.users. 
  -- So we delete from auth.users (requires service role / security definer)
  
  delete from auth.users where id = auth.uid();
end;
$$ language plpgsql security definer;

-- Ensure constraints cascade deleting
-- Profiles -> Auth.Users
alter table public.profiles
drop constraint if exists profiles_id_fkey,
add constraint profiles_id_fkey
  foreign key (id)
  references auth.users(id)
  on delete cascade;

-- Classes -> Profiles (Instructor)
alter table public.classes
drop constraint if exists classes_instructor_id_fkey,
add constraint classes_instructor_id_fkey
  foreign key (instructor_id)
  references public.profiles(id)
  on delete cascade;

-- Enrollments -> Profiles (User) and Classes
alter table public.enrollments
drop constraint if exists enrollments_user_id_fkey,
add constraint enrollments_user_id_fkey
  foreign key (user_id)
  references public.profiles(id)
  on delete cascade;

alter table public.enrollments
drop constraint if exists enrollments_class_id_fkey,
add constraint enrollments_class_id_fkey
  foreign key (class_id)
  references public.classes(id)
  on delete cascade;

-- Exams -> Classes
alter table public.exams
drop constraint if exists exams_class_id_fkey,
add constraint exams_class_id_fkey
  foreign key (class_id)
  references public.classes(id)
  on delete cascade;

-- Submissions -> Exams and Profiles (Student)
alter table public.submissions
drop constraint if exists submissions_exam_id_fkey,
add constraint submissions_exam_id_fkey
  foreign key (exam_id)
  references public.exams(id)
  on delete cascade;

alter table public.submissions
drop constraint if exists submissions_student_id_fkey,
add constraint submissions_student_id_fkey
  foreign key (student_id)
  references public.profiles(id)
  on delete cascade;
