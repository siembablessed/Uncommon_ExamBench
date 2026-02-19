'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { MapPin } from 'lucide-react'
import OnlineUsersList from '@/components/OnlineUsersList'
import StudentDirectory from '@/components/dashboard/StudentDirectory'
import StatsCards from '@/components/dashboard/StatsCards'
import ClassesList from '@/components/dashboard/ClassesList'
import ExamsList from '@/components/dashboard/ExamsList'
import CreateClassModal from '@/components/dashboard/CreateClassModal'
import { ClassItem, ExamItem } from '@/types'
import { toast } from 'sonner'

export default function InstructorDashboard() {
    const supabase = createClient()
    const [classes, setClasses] = useState<ClassItem[]>([])
    const [exams, setExams] = useState<ExamItem[]>([])
    const [loading, setLoading] = useState(true)
    const [newClassName, setNewClassName] = useState('')
    const [showCreateClass, setShowCreateClass] = useState(false)
    const [recentSubmissionCount, setRecentSubmissionCount] = useState(0)
    const [hub, setHub] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'overview' | 'directory'>('overview')

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
        console.log('Creating class with name:', newClassName)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            console.error('No user found')
            return
        }

        const { data, error } = await supabase.from('classes').insert({
            name: newClassName,
            instructor_id: user.id
        }).select()

        if (!error) {
            console.log('Class created successfully:', data)
            setNewClassName('')
            setShowCreateClass(false)
            fetchData()
            toast.success('Class created successfully!')
        } else {
            console.error('Error creating class:', error)
            toast.error('Error creating class: ' + error.message)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]" suppressHydrationWarning>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" suppressHydrationWarning></div>
        </div>
    )

    return (
        <div className="container mx-auto px-6 py-8 max-w-7xl" suppressHydrationWarning>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Instructor Dashboard</h1>
                    <div className="flex items-center gap-3 text-slate-500 text-sm">
                        <p>Manage your classes, students, and assessments</p>
                        {hub && (
                            <>
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium border border-indigo-100 text-xs">
                                    <MapPin size={12} /> {hub} Hub
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                    <button
                        onClick={() => {
                            console.log('Switching to overview')
                            setActiveTab('overview')
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'overview'
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => {
                            console.log('Switching to directory')
                            setActiveTab('directory')
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'directory'
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                    >
                        Student Directory
                    </button>
                </div>
            </div>

            {activeTab === 'overview' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                    <StatsCards
                        classCount={classes.length}
                        examCount={exams.length}
                        recentSubmissionCount={recentSubmissionCount}
                    />

                    {/* Main Content Grid */}
                    {/* Main Content Grid */}
                    <div className="space-y-6">
                        {showCreateClass && (
                            <CreateClassModal
                                newClassName={newClassName}
                                setNewClassName={setNewClassName}
                                handleCreateClass={handleCreateClass}
                                onCancel={() => setShowCreateClass(false)}
                            />
                        )}

                        <div className="grid md:grid-cols-2 gap-6">
                            <ClassesList
                                classes={classes}
                                onCreateClass={() => setShowCreateClass(true)}
                            />
                            <ExamsList exams={exams} />
                        </div>
                    </div>

                    {/* Fixed Position Live Activity Pill */}
                    <OnlineUsersList />
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <StudentDirectory />
                </div>
            )}
        </div>
    )
}
