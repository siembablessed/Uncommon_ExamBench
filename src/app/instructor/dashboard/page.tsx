'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PlusCircle, MapPin } from 'lucide-react'
import OnlineUsersList from '@/components/OnlineUsersList'
import StatsCards from '@/components/dashboard/StatsCards'
import ClassesList from '@/components/dashboard/ClassesList'
import ExamsList from '@/components/dashboard/ExamsList'
import CreateClassModal from '@/components/dashboard/CreateClassModal'
import { ClassItem, ExamItem } from '@/types'

export default function InstructorDashboard() {
    const [classes, setClasses] = useState<ClassItem[]>([])
    const [exams, setExams] = useState<ExamItem[]>([])
    const [loading, setLoading] = useState(true)
    const [newClassName, setNewClassName] = useState('')
    const [showCreateClass, setShowCreateClass] = useState(false)
    const [recentSubmissionCount, setRecentSubmissionCount] = useState(0)
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

            // Fetch classes
            const { data: classesData } = await supabase
                .from('classes')
                .select('*')
                .eq('instructor_id', user.id)
                .order('created_at', { ascending: false })

            if (classesData) setClasses(classesData)

            // Fetch exams created by this instructor
            const { data: examsData } = await supabase
                .from('exams')
                .select('*')
                .eq('created_by', user.id)
                .order('created_at', { ascending: false })

            if (examsData) setExams(examsData)

            // Fetch submissions for metrics
            const { data: submissionsData } = await supabase
                .from('submissions')
                .select('id, grade, status, created_at')
                .in('exam_id', examsData?.map(e => e.id) || [])

            if (submissionsData) {
                // Calculate metrics
                const recentSubmissions = submissionsData.filter(s => {
                    const submissionDate = new Date(s.created_at)
                    const oneDayAgo = new Date()
                    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
                    return submissionDate > oneDayAgo
                }).length

                setRecentSubmissionCount(recentSubmissions)
            }

        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase.from('classes').insert({
            name: newClassName,
            instructor_id: user.id
        })

        if (!error) {
            setNewClassName('')
            setShowCreateClass(false)
            fetchData()
        } else {
            alert('Error creating class: ' + error.message)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]" suppressHydrationWarning>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" suppressHydrationWarning></div>
        </div>
    )

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-slate-900">Instructor Dashboard</h1>
                        {hub && (
                            <span className="flex items-center gap-1 text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium border border-indigo-100">
                                <MapPin size={14} /> {hub} Hub
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500">Manage your classes and assessments</p>
                </div>
                <button
                    onClick={() => setShowCreateClass(!showCreateClass)}
                    className="btn-primary flex items-center gap-2"
                >
                    <PlusCircle size={20} /> Create New Class
                </button>
            </div>

            <StatsCards
                classCount={classes.length}
                examCount={exams.length}
                recentSubmissionCount={recentSubmissionCount}
            />

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Classes and Exams */}
                <div className="lg:col-span-2 space-y-8">

                    {showCreateClass && (
                        <CreateClassModal
                            newClassName={newClassName}
                            setNewClassName={setNewClassName}
                            handleCreateClass={handleCreateClass}
                            onCancel={() => setShowCreateClass(false)}
                        />
                    )}

                    <div className="grid lg:grid-cols-2 gap-8">
                        <ClassesList classes={classes} />
                        <ExamsList exams={exams} />
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-8">
                    <OnlineUsersList />
                </div>
            </div>
        </div>
    )
}
