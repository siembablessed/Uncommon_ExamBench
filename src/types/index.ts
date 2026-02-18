export interface ClassItem {
    id: string
    name: string
    created_at: string
    instructor_id?: string
}

export interface Question {
    id: string
    text: string
    options: string[]
    correctAnswer: string
    points: number
}

export interface ExamItem {
    id: string
    title: string
    class_id: string
    due_date: string
    created_by?: string
    created_at?: string
    questions?: Question[]
}

export interface SubmissionItem {
    id: string
    grade: number | null
    status: 'submitted' | 'graded' | 'late'
    created_at: string
    exam_id?: string
    student_id?: string
    content?: any
    feedback?: any
    submitted_at?: string
}

export interface UserProfile {
    id: string
    full_name: string
    email: string
    role: 'instructor' | 'student'
    avatar_url?: string
    hub?: string
}
