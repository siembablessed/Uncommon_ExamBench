-- Add duration_minutes column to exams table
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS duration_minutes integer;

-- Comment on column
COMMENT ON COLUMN public.exams.duration_minutes IS 'Duration of the exam in minutes. Null means no time limit.';
