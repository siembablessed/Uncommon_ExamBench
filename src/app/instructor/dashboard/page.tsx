'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { PlusCircle, Users, FileText, TrendingUp, Calendar, ArrowRight } from 'lucide-react'

// Define interfaces for data
interface ClassItem {
    id: string
    name: string
    created_at: string
}

interface ExamItem {
    id: string
    title: string
    class_id: string
    due_date: string
}

export default function InstructorDashboard() {
    const [classes, setClasses] = useState<ClassItem[]>([])
    const [exams, setExams] = useState<ExamItem[]>([])
    const [loading, setLoading] = useState(true)
    const [newClassName, setNewClassName] = useState('')
    const [showCreateClass, setShowCreateClass] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return

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
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    )

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Instructor Dashboard</h1>
                    <p className="text-slate-500">Manage your classes and assessments</p>
                </div>
                <button
                    onClick={() => setShowCreateClass(!showCreateClass)}
                    className="btn-primary flex items-center gap-2"
                >
                    <PlusCircle size={20} /> Create New Class
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Users size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">{classes.length}</div>
                        <div className="text-sm text-slate-500">Active Classes</div>
                    </div>
                </div>
                <div className="card flex items-center gap-4">
                    <div className="p-3 bg-violet-50 text-violet-600 rounded-lg">
                        <FileText size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">{exams.length}</div>
                        <div className="text-sm text-slate-500">Total Exams</div>
                    </div>
                </div>
                <div className="card flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">--</div>
                        <div className="text-sm text-slate-500">Avg. Completion</div>
                    </div>
                </div>
            </div>

            {showCreateClass && (
                <div className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-indigo-100 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Create New Class</h3>
                    <form onSubmit={handleCreateClass} className="flex gap-3">
                        <input
                            type="text"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            placeholder="e.g. Advanced Biology 101"
                            className="input-field flex-1"
                            required
                        />
                        <button type="submit" className="btn-primary bg-emerald-600 hover:bg-emerald-700">
                            Create Class
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowCreateClass(false)}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Classes Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Users size={20} className="text-indigo-600" /> Your Classes
                        </h2>
                    </div>
                    <div className="grid gap-3">
                        {classes.length === 0 ? (
                            <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-500">No classes created yet.</p>
                            </div>
                        ) : (
                            classes.map((cls) => (
                                <Link key={cls.id} href={`/instructor/classes/${cls.id}`} className="block group">
                                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{cls.name}</h3>
                                            <p className="text-xs text-slate-400 font-mono mt-1">{cls.id.slice(0, 8)}...</p>
                                        </div>
                                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-medium group-hover:bg-indigo-600 group-hover:text-white transition-colors">Manage</span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </section>

                {/* Exams Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <FileText size={20} className="text-indigo-600" /> Recent Exams
                        </h2>
                        <Link
                            href="/instructor/exams/create"
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                            + New Exam
                        </Link>
                    </div>
                    <div className="grid gap-3">
                        {exams.length === 0 ? (
                            <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-500">No exams created yet.</p>
                                <Link href="/instructor/exams/create" className="text-indigo-600 font-medium text-sm mt-2 block hover:underline">Create your first exam</Link>
                            </div>
                        ) : (
                            exams.map((exam) => (
                                <div key={exam.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-900">{exam.title}</h3>
                                        <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-1 rounded-full border border-amber-100">
                                            {new Date() > new Date(exam.due_date) ? 'Closed' : 'Active'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                        <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(exam.due_date).toLocaleDateString()}</span>
                                    </div>
                                    <Link
                                        href={`/instructor/exams/${exam.id}`}
                                        className="flex items-center justify-between w-full text-sm font-medium text-indigo-600 hover:bg-indigo-50 p-2 rounded transition-colors"
                                    >
                                        View Submissions <ArrowRight size={16} />
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    )
}
