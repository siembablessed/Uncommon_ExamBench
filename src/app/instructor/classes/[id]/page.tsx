'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Trash2, Users, Mail } from 'lucide-react'

interface Student {
    id: string
    full_name: string
    email: string
    enrolled_at: string
}

interface ClassDetails {
    id: string
    name: string
    instructor_id: string
}

export default function ClassDetailPage() {
    const params = useParams()
    const router = useRouter()
    const classId = params.id as string

    const [classData, setClassData] = useState<ClassDetails | null>(null)
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(true)
    const [emailInput, setEmailInput] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

    useEffect(() => {
        fetchClassDetails()
    }, [classId])

    const fetchClassDetails = async () => {
        try {
            // Fetch class info
            const { data: cls, error: clsError } = await supabase
                .from('classes')
                .select('*')
                .eq('id', classId)
                .single()

            if (clsError) throw clsError
            setClassData(cls)

            // Fetch enrolled students
            // Note: This requires a join with profiles. 
            // Since we might not have foreign key setup perfectly for 'email' visibility in join without explicit selection or view, 
            // we will try to fetch profiles via enrollments.
            const { data: enrollments, error: enrollError } = await supabase
                .from('enrollments')
                .select(`
                enrolled_at,
                profiles (id, full_name, email)
            `)
                .eq('class_id', classId)

            if (enrollError) throw enrollError

            // Transform data structure
            const studentList = enrollments.map((e: any) => ({
                id: e.profiles.id,
                full_name: e.profiles.full_name,
                email: e.profiles.email || 'No email',
                enrolled_at: e.enrolled_at
            }))

            setStudents(studentList)

        } catch (error: any) {
            console.error('Error fetching class:', error)
            setMessage({ text: 'Failed to load class details', type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsAdding(true)
        setMessage(null)

        try {
            // 1. Find user by email
            const { data: users, error: userError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', emailInput)
                .single()

            if (userError || !users) {
                setMessage({ text: 'User not found with this email.', type: 'error' })
                return
            }

            // 2. Check if already enrolled
            const { data: existing } = await supabase
                .from('enrollments')
                .select('*')
                .eq('class_id', classId)
                .eq('user_id', users.id)
                .single()

            if (existing) {
                setMessage({ text: 'User is already enrolled in this class.', type: 'error' })
                return
            }

            // 3. Enroll user
            const { error: enrollError } = await supabase
                .from('enrollments')
                .insert({
                    class_id: classId,
                    user_id: users.id
                })

            if (enrollError) throw enrollError

            setMessage({ text: 'Student added successfully!', type: 'success' })
            setEmailInput('')
            fetchClassDetails() // Refresh list

        } catch (error: any) {
            console.error('Add student error:', error)
            setMessage({ text: error.message || 'Failed to add student', type: 'error' })
        } finally {
            setIsAdding(false)
        }
    }

    const handleRemoveStudent = async (studentId: string) => {
        if (!confirm('Are you sure you want to remove this student from the class?')) return

        try {
            const { error } = await supabase
                .from('enrollments')
                .delete()
                .eq('class_id', classId)
                .eq('user_id', studentId)

            if (error) throw error

            setStudents(students.filter(s => s.id !== studentId))
            setMessage({ text: 'Student removed.', type: 'success' })

        } catch (error: any) {
            console.error('Remove error:', error)
            setMessage({ text: 'Failed to remove student', type: 'error' })
        }
    }

    // --- Directory Feature ---
    const [directory, setDirectory] = useState<Student[]>([])
    const [directoryLoading, setDirectoryLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [showDirectory, setShowDirectory] = useState(false)

    const fetchDirectory = async () => {
        try {
            setDirectoryLoading(true)
            // Fetch all students
            const { data: allStudents, error } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .eq('role', 'student')
                .order('full_name')

            if (error) throw error

            // Filter out already enrolled
            const enrolledIds = new Set(students.map(s => s.id))
            const available = allStudents.filter(s => !enrolledIds.has(s.id))

            setDirectory(available as any)
        } catch (error) {
            console.error('Directory fetch error:', error)
        } finally {
            setDirectoryLoading(false)
        }
    }

    useEffect(() => {
        if (showDirectory) {
            fetchDirectory()
        }
    }, [showDirectory, students]) // Re-fetch if students list changes (e.g. after add)

    const handleAddFromDirectory = async (student: Student) => {
        try {
            const { error: enrollError } = await supabase
                .from('enrollments')
                .insert({
                    class_id: classId,
                    user_id: student.id
                })

            if (enrollError) throw enrollError

            setMessage({ text: `Added ${student.full_name}!`, type: 'success' })

            // Refresh main list and directory
            fetchClassDetails()
            // setDirectory(prev => prev.filter(s => s.id !== student.id)) // Optimistic update
        } catch (error: any) {
            console.error('Enroll error:', JSON.stringify(error, null, 2))

            // Handle duplicate key error (already enrolled)
            if (error.code === '23505') {
                setMessage({ text: `${student.full_name} is already enrolled.`, type: 'success' }) // Treat as success or info
                fetchClassDetails() // Refresh to be safe
            } else {
                setMessage({ text: error.message || 'Failed to add student', type: 'error' })
            }
        }
    }

    const filteredDirectory = directory.filter(s =>
        s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    )

    if (!classData) return (
        <div className="container mx-auto px-6 py-8">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-800">Class not found</h1>
                <Link href="/instructor/classes" className="text-indigo-600 hover:underline mt-4 inline-block">
                    Back to Classes
                </Link>
            </div>
        </div>
    )

    return (
        <div className="container mx-auto px-6 py-8">
            <Link href="/instructor/classes" className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
                <ArrowLeft size={16} className="mr-1" /> Back to Classes
            </Link>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">{classData.name}</h1>
                            <p className="text-slate-500 font-mono text-sm">Class ID: {classData.id}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium">
                            <Users size={16} />
                            {students.length} Students Enrolled
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Student List */}
                        <div className="lg:col-span-2 space-y-6">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                Enrolled Students
                            </h2>

                            {students.length === 0 ? (
                                <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                    <p className="text-slate-500">No students enrolled yet.</p>
                                </div>
                            ) : (
                                <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-100 text-slate-600 font-medium border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3">Name</th>
                                                <th className="px-4 py-3">Email</th>
                                                <th className="px-4 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {students.map((student) => (
                                                <tr key={student.id} className="hover:bg-white transition-colors">
                                                    <td className="px-4 py-3 font-medium text-slate-900">{student.full_name}</td>
                                                    <td className="px-4 py-3 text-slate-500">{student.email}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            onClick={() => handleRemoveStudent(student.id)}
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                                                            title="Remove Student"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Add Student Form */}
                        {/* Add Student Form & Directory */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Directory Toggle */}
                            <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <UserPlus size={20} className="text-indigo-600" /> Add Students
                                </h3>

                                <div className="flex gap-2 mb-4">
                                    <button
                                        onClick={() => setShowDirectory(false)}
                                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${!showDirectory ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        By Email
                                    </button>
                                    <button
                                        onClick={() => setShowDirectory(true)}
                                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${showDirectory ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        Directory
                                    </button>
                                </div>

                                {message && (
                                    <div className={`p-3 rounded text-sm mb-4 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                        {message.text}
                                    </div>
                                )}

                                {!showDirectory ? (
                                    <form onSubmit={handleAddStudent} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Student Email</label>
                                            <div className="relative">
                                                <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                                                <input
                                                    type="email"
                                                    value={emailInput}
                                                    onChange={(e) => setEmailInput(e.target.value)}
                                                    className="input-field pl-10 w-full"
                                                    placeholder="student@example.com"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isAdding}
                                            className="btn-primary w-full justify-center"
                                        >
                                            {isAdding ? 'Adding...' : 'Add Student'}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search students..."
                                            className="input-field w-full text-sm"
                                        />

                                        <div className="h-64 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-slate-50">
                                            {directoryLoading ? (
                                                <div className="p-4 text-center text-slate-400 text-xs">Loading directory...</div>
                                            ) : filteredDirectory.length === 0 ? (
                                                <div className="p-4 text-center text-slate-400 text-xs">
                                                    {searchTerm ? 'No matches found.' : 'No available students found.'}
                                                </div>
                                            ) : (
                                                filteredDirectory.map(student => (
                                                    <div key={student.id} className="p-3 bg-white hover:bg-indigo-50 transition-colors flex justify-between items-center group">
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-medium text-slate-900 truncate">{student.full_name}</div>
                                                            <div className="text-xs text-slate-500 truncate">{student.email}</div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleAddFromDirectory(student)}
                                                            className="text-indigo-600 hover:bg-indigo-100 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Add to Class"
                                                        >
                                                            <UserPlus size={16} />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
