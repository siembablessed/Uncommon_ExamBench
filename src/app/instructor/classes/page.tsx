'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, PlusCircle, ArrowRight, Trash2, Calendar } from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'

interface ClassItem {
    id: string
    name: string
    created_at: string
    student_count?: number
}

export default function ClassesPage() {
    const router = useRouter()
    const [classes, setClasses] = useState<ClassItem[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [classToDelete, setClassToDelete] = useState<string | null>(null)

    const fetchClasses = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch classes
        const { data: classesData } = await supabase
            .from('classes')
            .select('*')
            .eq('instructor_id', user.id)
            .order('created_at', { ascending: false })

        if (classesData) {
            // Fetch student counts for each class
            const classesWithCounts = await Promise.all(classesData.map(async (cls) => {
                const { count } = await supabase
                    .from('enrollments')
                    .select('*', { count: 'exact', head: true })
                    .eq('class_id', cls.id)

                return { ...cls, student_count: count || 0 }
            }))
            setClasses(classesWithCounts)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchClasses()
    }, [])

    const initiateDelete = (classId: string) => {
        setClassToDelete(classId)
        setConfirmOpen(true)
    }

    const handleDeleteClass = async () => {
        if (!classToDelete) return

        setDeleteLoading(classToDelete)
        setConfirmOpen(false) // Close modal immediately to show loading on card

        try {
            const { error } = await supabase
                .from('classes')
                .delete()
                .eq('id', classToDelete)

            if (error) throw error

            // Update local state
            setClasses(classes.filter(c => c.id !== classToDelete))
            router.refresh() // Force Next.js to revalidate data
        } catch (error) {
            console.error('Error deleting class:', error)
            alert('Failed to delete class')
        } finally {
            setDeleteLoading(null)
            setClassToDelete(null)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    )

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Classes</h1>
                    <p className="text-slate-500 mt-1">Manage your active classes and students</p>
                </div>
                <Link href="/instructor/dashboard" className="btn-primary flex items-center gap-2 shadow-sm hover:shadow-md transition-all">
                    <PlusCircle size={20} /> <span className="hidden sm:inline">New Class</span>
                </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => (
                    <div key={cls.id} className="group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-105 transition-transform duration-300">
                                    <Users size={24} />
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => initiateDelete(cls.id)}
                                        disabled={deleteLoading === cls.id}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Delete Class"
                                    >
                                        {deleteLoading === cls.id ? (
                                            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Trash2 size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <Link href={`/instructor/classes/${cls.id}`} className="block">
                                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                    {cls.name}
                                </h3>

                                <div className="flex items-center gap-4 text-sm text-slate-500 mt-4">
                                    <div className="flex items-center gap-1.5">
                                        <Users size={14} />
                                        <span>{cls.student_count} Students</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={14} />
                                        <span>{new Date(cls.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-mono text-slate-400">
                                ID: {cls.id.slice(0, 8)}
                            </span>
                            <Link
                                href={`/instructor/classes/${cls.id}`}
                                className="text-indigo-600 font-medium text-sm flex items-center group-hover:translate-x-1 transition-transform"
                            >
                                Manage <ArrowRight size={16} className="ml-1" />
                            </Link>
                        </div>
                    </div>
                ))}

                {classes.length === 0 && (
                    <div className="col-span-full py-16 text-center bg-white rounded-xl border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-1">No classes yet</h3>
                        <p className="text-slate-500 mb-6">Create your first class to get started</p>
                        <Link href="/instructor/dashboard" className="btn-primary inline-flex">
                            Create Class
                        </Link>
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={confirmOpen}
                title="Delete Class"
                message="Are you sure you want to delete this class? This will permanently delete all associated enrollments, exams, and submissions. This action cannot be undone."
                confirmText="Yes, Delete Class"
                onConfirm={handleDeleteClass}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    )
}
