INSERT INTO public.classes (id, name, instructor_id)
VALUES 
  (gen_random_uuid(), 'Introduction to Physics', '680090bb-a9d0-4afd-b838-49daf2304ac2'),
  (gen_random_uuid(), 'Advanced Mathematics', '680090bb-a9d0-4afd-b838-49daf2304ac2');

-- Check class IDs first if you want to link specific exams, or use subquery
INSERT INTO public.exams (id, title, description, class_id, due_date, created_by)
SELECT 
  gen_random_uuid(), 
  'Physics Midterm', 
  'Chapters 1-5 covered. Good luck!', 
  id, 
  NOW() + INTERVAL '7 days', 
  '680090bb-a9d0-4afd-b838-49daf2304ac2'
FROM public.classes 
WHERE name = 'Introduction to Physics' AND instructor_id = '680090bb-a9d0-4afd-b838-49daf2304ac2'
LIMIT 1;
