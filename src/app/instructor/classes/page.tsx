'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Users, PlusCircle, ArrowRight } from 'lucide-react'

interface ClassItem {
    id: string
    name: string
    created_at: string
}

export default function ClassesPage() {
    const [classes, setClasses] = useState<ClassItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchClasses = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('classes')
                .select('*')
                .eq('instructor_id', user.id)
                .order('created_at', { ascending: false })

            if (data) setClasses(data)
            setLoading(false)
        }

        fetchClasses()
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    )

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Classes</h1>
                    <p className="text-slate-500">Manage your classes and students</p>
                </div>
                <Link href="/instructor/dashboard" className="btn-primary flex items-center gap-2">
                    <PlusCircle size={20} /> New Class
                </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => (
                    <Link key={cls.id} href={`/instructor/classes/${cls.id}`} className="group relative block">
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <Users size={24} />
                                    </div>
                                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                        {cls.id.slice(0, 8)}...
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{cls.name}</h3>
                                <p className="text-sm text-slate-500">Created on {new Date(cls.created_at).toLocaleDateString()}</p>
                            </div>

                            <div className="mt-6 flex items-center text-indigo-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                                Manage Class <ArrowRight size={16} className="ml-1" />
                            </div>
                        </div>
                    </Link>
                ))}

                {classes.length === 0 && (
                    <div className="col-span-full text-center p-12 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
                        <p className="text-slate-500 mb-4">You haven't created any classes yet.</p>
                        <Link href="/instructor/dashboard" className="text-indigo-600 font-medium hover:underline">
                            Go to Dashboard to create one
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
