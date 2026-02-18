-- Add questions column to exams table
alter table public.exams 
add column if not exists questions jsonb;

-- Add answers column to submissions table for auto-grading
alter table public.submissions
add column if not exists answers jsonb;
