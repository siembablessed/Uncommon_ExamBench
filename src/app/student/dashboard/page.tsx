'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin } from 'lucide-react'
import { ClassItem, ExamItem, SubmissionItem } from '@/types'
import StudentStatsCards from '@/components/dashboard/StudentStatsCards'
import StudentExamsList from '@/components/dashboard/StudentExamsList'
import EnrolledClassesList from '@/components/dashboard/EnrolledClassesList'



export default function StudentDashboard() {
    const [exams, setExams] = useState<ExamItem[]>([])
    const [submissions, setSubmissions] = useState<SubmissionItem[]>([])
    // Enrolled classes might need a custom type if ClassItem doesn't match the join query exact shape
    // But we only display name/id so ClassItem is fine if we map it
    const [classes, setClasses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [hub, setHub] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch profile for Hub
            const { data: profile } = await supabase
                .from('profiles')
                .select('hub')
                .eq('id', user.id)
                .single()

            if (profile?.hub) setHub(profile.hub)

            // Fetch enrolled classes
            const { data: enrollments } = await supabase
                .from('enrollments')
                .select('class_id, classes(name, id)')
                .eq('user_id', user.id)

            if (enrollments) {
                setClasses(enrollments.map(e => e.classes))

                // Fetch exams for enrolled classes
                const classIds = enrollments.map(e => e.class_id)
                if (classIds.length > 0) {
                    const { data: examsData } = await supabase
                        .from('exams')
                        .select('*')
                        .in('class_id', classIds)
                        .order('due_date', { ascending: true })

                    if (examsData) setExams(examsData)

                    // Fetch submissions
                    const { data: subsData } = await supabase
                        .from('submissions')
                        .select('*')
                        .eq('student_id', user.id)
                        .in('exam_id', examsData?.map(e => e.id) || [])

                    if (subsData) setSubmissions(subsData)
                }
            }

        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Calculate Metrics
    const now = new Date()
    const metrics = {
        avgGrade: 0,
        missed: 0,
        pending: 0,
        completed: 0
    }

    const getSubmission = (examId: string) => submissions.find(s => s.exam_id === examId)

    exams.forEach(exam => {
        const sub = getSubmission(exam.id)
        const isPastDue = new Date(exam.due_date) < now

        if (sub) {
            metrics.completed++
        } else {
            if (isPastDue) metrics.missed++
            else metrics.pending++
        }
    })

    const gradedSubs = submissions.filter(s => s.grade !== null)
    if (gradedSubs.length > 0) {
        const total = gradedSubs.reduce((acc, curr) => acc + (curr.grade || 0), 0)
        metrics.avgGrade = Math.round(total / gradedSubs.length)
    }

    const todoExams = exams.filter(e => !getSubmission(e.id) && new Date(e.due_date) > now)
    const missedExams = exams.filter(e => !getSubmission(e.id) && new Date(e.due_date) < now)
    const completedExams = exams.filter(e => getSubmission(e.id))

    if (loading) return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]" suppressHydrationWarning>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    )

    return (
        <div className="container mx-auto px-6 py-8 max-w-7xl" suppressHydrationWarning>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Student Dashboard</h1>
                    <div className="flex items-center gap-3 text-slate-500 text-sm">
                        <p>Track your progress and upcoming exams</p>
                        {hub && (
                            <>
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium border border-indigo-100 text-xs text-nowrap">
                                    <MapPin size={12} /> {hub} Hub
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <StudentStatsCards
                avgGrade={metrics.avgGrade}
                pending={metrics.pending}
                missed={metrics.missed}
                completed={metrics.completed}
            />

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content: Exams */}
                <div className="lg:col-span-2 space-y-8">
                    <StudentExamsList
                        todoExams={todoExams}
                        missedExams={missedExams}
                        completedExams={completedExams}
                        submissions={submissions}
                    />
                </div>

                {/* Sidebar: Classes */}
                <div className="space-y-6">
                    <EnrolledClassesList classes={classes} />
                </div>
            </div>
        </div>
    )
}

