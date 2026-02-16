'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { FileText, Clock, PlayCircle, BookOpen, CheckCircle } from 'lucide-react'

export default function StudentDashboard() {
    const [exams, setExams] = useState<any[]>([])
    const [submissions, setSubmissions] = useState<any[]>([])
    const [classes, setClasses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'todo' | 'missed' | 'completed'>('todo')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

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

    // Helper to check submission status
    const getSubmission = (examId: string) => submissions.find(s => s.exam_id === examId)

    // Process exams for metrics
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

    // Calculate avg grade
    const gradedSubs = submissions.filter(s => s.grade !== null)
    if (gradedSubs.length > 0) {
        const total = gradedSubs.reduce((acc, curr) => acc + (curr.grade || 0), 0)
        metrics.avgGrade = Math.round(total / gradedSubs.length)
    }

    // Filter lists for tabs
    const todoExams = exams.filter(e => !getSubmission(e.id) && new Date(e.due_date) > now)
    const missedExams = exams.filter(e => !getSubmission(e.id) && new Date(e.due_date) < now)
    const completedExams = exams.filter(e => getSubmission(e.id))

    if (loading) return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    )

    return (
        <div className="container mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Dashboard</h1>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard title="Avg. Grade" value={`${metrics.avgGrade}%`} icon={<CheckCircle className="text-emerald-600" />} />
                <StatCard title="Pending" value={metrics.pending} icon={<Clock className="text-indigo-600" />} />
                <StatCard title="Missed" value={metrics.missed} icon={<Clock className="text-red-500" />} />
                <StatCard title="Completed" value={metrics.completed} icon={<FileText className="text-slate-600" />} />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Column: Tabs & Exams */}
                <section className="lg:col-span-2 space-y-6">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 gap-6">
                        <button
                            className={`pb-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'todo' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setActiveTab('todo')}
                        >
                            To Do ({todoExams.length})
                        </button>
                        <button
                            className={`pb-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'missed' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setActiveTab('missed')}
                        >
                            Missed ({missedExams.length})
                        </button>
                        <button
                            className={`pb-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'completed' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setActiveTab('completed')}
                        >
                            Completed ({completedExams.length})
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* TO DO LIST */}
                        {activeTab === 'todo' && (
                            todoExams.length === 0 ? <EmptyState message="No pending exams." /> :
                                todoExams.map(exam => <ExamCard key={exam.id} exam={exam} status="active" />)
                        )}

                        {/* MISSED LIST */}
                        {activeTab === 'missed' && (
                            missedExams.length === 0 ? <EmptyState message="Great job! No missed exams." /> :
                                missedExams.map(exam => <ExamCard key={exam.id} exam={exam} status="missed" />)
                        )}

                        {/* COMPLETED LIST */}
                        {activeTab === 'completed' && (
                            completedExams.length === 0 ? <EmptyState message="You haven't completed any exams yet." /> :
                                completedExams.map(exam => {
                                    const sub = getSubmission(exam.id)
                                    return <ExamCard key={exam.id} exam={exam} status="completed" submission={sub} />
                                })
                        )}
                    </div>
                </section>

                {/* Sidebar: Classes */}
                <aside className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen size={24} className="text-indigo-600" /> My Classes
                    </h2>
                    <div className="card bg-white p-0 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {classes.length === 0 ? (
                                <div className="p-6 text-center text-slate-500">
                                    You are not enrolled in any classes.
                                </div>
                            ) : (
                                classes.map((cls: any) => (
                                    <div key={cls.id} className="p-4 hover:bg-slate-50 transition-colors">
                                        <h3 className="font-semibold text-slate-900">{cls.name}</h3>
                                        <p className="text-xs text-slate-400 mt-1">Student</p>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-center text-slate-500">
                            Ask your instructor for an enrollment code.
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon }: any) {
    return (
        <div className="card p-4 flex items-center gap-4">
            <div className="bg-slate-50 p-3 rounded-full">{icon}</div>
            <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{title}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    )
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">{message}</p>
        </div>
    )
}

function ExamCard({ exam, status, submission }: { exam: any, status: 'active' | 'missed' | 'completed', submission?: any }) {
    return (
        <div className={`card hover:shadow-md transition-all duration-200 border-l-4 ${status === 'missed' ? 'border-l-red-500 bg-red-50/10' :
            status === 'completed' ? 'border-l-emerald-500' : 'border-l-indigo-500'
            }`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="font-bold text-lg text-slate-900">{exam.title}</h3>
                    <div className="text-sm text-slate-500 flex items-center gap-3 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${status === 'missed' ? 'bg-red-100 text-red-700' :
                            status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                            {status === 'missed' ? 'Missed' : status === 'completed' ? 'Submitted' : 'Due'}
                        </span>
                        {activeTabDate(status, exam, submission)}
                    </div>
                </div>

                {status === 'active' && (
                    <Link href={`/student/exams/${exam.id}`} className="btn-primary flex items-center gap-2 whitespace-nowrap">
                        Start <PlayCircle size={16} />
                    </Link>
                )}

                {status === 'completed' && (
                    <div className="text-right">
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Grade</div>
                        <div className={`text-lg font-bold ${submission?.grade ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {submission?.grade !== null ? `${submission.grade}%` : 'Pending'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function activeTabDate(status: string, exam: any, sub: any) {
    if (status === 'completed') return `on ${new Date(sub.submitted_at).toLocaleDateString()}`
    return new Date(exam.due_date).toLocaleString()
}
