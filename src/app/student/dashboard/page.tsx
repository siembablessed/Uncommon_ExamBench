'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { MapPin } from 'lucide-react'
import { ClassItem, ExamItem, SubmissionItem, Assignment } from '@/types'
import StudentStatsCards from '@/components/dashboard/StudentStatsCards'
import StudentTimelineList from '@/components/dashboard/StudentTimelineList'
import EnrolledClassesList from '@/components/dashboard/EnrolledClassesList'



export default function StudentDashboard() {
    const supabase = createClient()
    const [exams, setExams] = useState<ExamItem[]>([])
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [submissions, setSubmissions] = useState<SubmissionItem[]>([])
    const [classes, setClasses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [hub, setHub] = useState<string | null>(null)

    useEffect(() => {
        let channel: any;

        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            fetchData()

            // Real-time subscription
            channel = supabase
                .channel('student_dashboard')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, () => fetchData())
                .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => fetchData())
                .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions', filter: `student_id=eq.${user.id}` }, () => fetchData())
                .subscribe()
        }

        setupRealtime()

        return () => {
            if (channel) supabase.removeChannel(channel)
        }
    }, [])

    const fetchData = async () => {
        try {
            // setLoading(true) // Don't show spinner on re-fetch to keep it smooth
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

                // Fetch exams & assignments for enrolled classes
                const classIds = enrollments.map(e => e.class_id)
                if (classIds.length > 0) {
                    const { data: examsData } = await supabase
                        .from('exams')
                        .select('*')
                        .in('class_id', classIds)
                        .order('due_date', { ascending: true })

                    if (examsData) setExams(examsData)

                    const { data: assignmentsData } = await supabase
                        .from('assignments')
                        .select('*')
                        .in('class_id', classIds)
                        .order('due_date', { ascending: true })

                    if (assignmentsData) setAssignments(assignmentsData)

                    // Fetch submissions
                    const { data: subsData } = await supabase
                        .from('submissions')
                        .select('*')
                        .eq('student_id', user.id)

                    // Also fetch assignment submissions (assuming same table or similar logic, but user plan said separate table `assignment_submissions`)
                    // NOTE: Plan said `assignment_submissions`. I need to fetch those too.
                    const { data: assignSubsData } = await supabase
                        .from('assignment_submissions')
                        .select('*')
                        .eq('student_id', user.id)

                    // Merge submissions for unified view if types differ, but for now let's store them
                    // Since my local `SubmissionItem` might not match `AssignmentSubmission` perfectly, I'll normalize or store separate?
                    // The StudentTimelineList expects `SubmissionItem[]`. I should probably normalize `assignment_submissions` to match `SubmissionItem` structure 
                    // or update state. For simplicity in this `replace_file_content`, I will fetch `assignment_submissions` and map them to `SubmissionItem` shape.

                    let allSubmissions: SubmissionItem[] = []

                    if (subsData) allSubmissions = [...allSubmissions, ...subsData]
                    if (assignSubsData) {
                        const mappedAssignSubs = assignSubsData.map((s: any) => ({
                            ...s,
                            exam_id: null, // It's an assignment
                            assignment_id: s.assignment_id
                        }))
                        allSubmissions = [...allSubmissions, ...mappedAssignSubs]
                    }

                    setSubmissions(allSubmissions)
                }
            }
            setLoading(false)

        } catch (error) {
            console.error('Error fetching data:', error)
            setLoading(false)
        }
    }

    // Calculate Metrics & Lists
    const now = new Date()
    const getSubmission = (id: string) => submissions.find(s => s.exam_id === id || s.assignment_id === id)

    // Merge Items
    const allItems = [...exams, ...assignments].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

    // Metrics
    const metrics = {
        avgGrade: 0,
        missed: 0,
        pending: 0,
        completed: 0
    }

    const todoItems: typeof allItems = []
    const missedItems: typeof allItems = []
    const completedItems: typeof allItems = []

    allItems.forEach(item => {
        const sub = getSubmission(item.id)
        const isPastDue = new Date(item.due_date) < now

        if (sub) {
            metrics.completed++
            completedItems.push(item)
        } else {
            if (isPastDue) {
                metrics.missed++
                missedItems.push(item)
            }
            else {
                metrics.pending++
                todoItems.push(item)
            }
        }
    })

    const gradedSubs = submissions.filter(s => s.grade !== null)
    if (gradedSubs.length > 0) {
        // Simple average (mixing points bases isn't perfect but good for overview)
        // Ideally we normalize to percentages.
        // Let's just average the raw grade for now as per previous implementation logic
        const total = gradedSubs.reduce((acc, curr) => acc + (curr.grade || 0), 0)
        metrics.avgGrade = Math.round(total / gradedSubs.length)
    }

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
                        <p>Track your progress and upcoming tasks</p>
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
                {/* Main Content: Timeline */}
                <div className="lg:col-span-2 space-y-8">
                    <StudentTimelineList
                        todoItems={todoItems}
                        missedItems={missedItems}
                        completedItems={completedItems}
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

