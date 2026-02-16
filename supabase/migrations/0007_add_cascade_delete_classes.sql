-- Add ON DELETE CASCADE to enrollments referencing classes
alter table public.enrollments 
drop constraint if exists enrollments_class_id_fkey;

alter table public.enrollments 
add constraint enrollments_class_id_fkey 
foreign key (class_id) 
references public.classes(id) 
on delete cascade;

-- Add ON DELETE CASCADE to exams referencing classes
alter table public.exams 
drop constraint if exists exams_class_id_fkey;

alter table public.exams 
add constraint exams_class_id_fkey 
foreign key (class_id) 
references public.classes(id) 
on delete cascade;

-- Add ON DELETE CASCADE to submissions referencing exams
alter table public.submissions 
drop constraint if exists submissions_exam_id_fkey;

alter table public.submissions 
add constraint submissions_exam_id_fkey 
foreign key (exam_id) 
references public.exams(id) 
on delete cascade;
