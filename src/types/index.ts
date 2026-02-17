export interface ClassItem {
    id: string
    name: string
    created_at: string
    instructor_id?: string
}

export interface ExamItem {
    id: string
    title: string
    class_id: string
    due_date: string
    created_by?: string
    created_at?: string
}

export interface SubmissionItem {
    id: string
    grade: number | null
    status: 'submitted' | 'graded' | 'late'
    created_at: string
    exam_id?: string
    student_id?: string
}

export interface UserProfile {
    id: string
    full_name: string
    email: string
    role: 'instructor' | 'student'
    avatar_url?: string
}
