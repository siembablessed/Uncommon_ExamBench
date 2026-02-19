-- Create Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    points INTEGER DEFAULT 100,
    late_penalty_amount INTEGER DEFAULT 15,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Assignment Submissions Table
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES auth.users(id) NOT NULL,
    file_url TEXT NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    is_late BOOLEAN DEFAULT FALSE,
    grade INTEGER,
    feedback TEXT,
    agreement_confirmed BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR ASSIGNMENTS

-- Instructors can perform all actions on their own assignments
CREATE POLICY "Instructors can manage their own assignments"
ON public.assignments
FOR ALL
USING (auth.uid() = created_by);

-- Students can view assignments for classes they are enrolled in
CREATE POLICY "Students can view assignments for enrolled classes"
ON public.assignments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.enrollments
        WHERE public.enrollments.class_id = public.assignments.class_id
        AND public.enrollments.user_id = auth.uid()
    )
);

-- POLICIES FOR SUBMISSIONS

-- Students can view their own submissions
CREATE POLICY "Students can view own submissions"
ON public.assignment_submissions
FOR SELECT
USING (auth.uid() = student_id);

-- Students can insert their own submissions
CREATE POLICY "Students can upload submissions"
ON public.assignment_submissions
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Instructors can view submissions for assignments they created
CREATE POLICY "Instructors can view submissions for their assignments"
ON public.assignment_submissions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.assignments
        WHERE public.assignments.id = public.assignment_submissions.assignment_id
        AND public.assignments.created_by = auth.uid()
    )
);

-- Instructors can update (grade) submissions for their assignments
CREATE POLICY "Instructors can grade submissions"
ON public.assignment_submissions
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.assignments
        WHERE public.assignments.id = public.assignment_submissions.assignment_id
        AND public.assignments.created_by = auth.uid()
    )
);
