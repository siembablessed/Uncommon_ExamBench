'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { UserProfile, ClassItem } from '@/types'
import { Trash2, UserPlus, Search, CheckSquare, Square, X, ChevronLeft, ChevronRight } from 'lucide-react'

import { toast } from 'sonner'

export default function StudentDirectory() {
    const supabase = createClient()
    const [students, setStudents] = useState<UserProfile[]>([])
    const [classes, setClasses] = useState<ClassItem[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStudents, setSelectedStudents] = useState<string[]>([])
    const [showEnrollModal, setShowEnrollModal] = useState(false)
    const [selectedClassId, setSelectedClassId] = useState('')
    const [enrollLoading, setEnrollLoading] = useState(false)

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(5)

    useEffect(() => {
        console.log('StudentDirectory mounted')
        fetchData()
    }, [])

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch all students (profiles with role 'student')
            const { data: studentsData } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'student')
                .order('full_name', { ascending: true })

            if (studentsData) setStudents(studentsData)

            // Fetch instructor's classes for enrollment dropdown
            const { data: classesData } = await supabase
                .from('classes')
                .select('*')
                .eq('instructor_id', user.id)
                .order('created_at', { ascending: false })

            if (classesData) setClasses(classesData)

        } catch (error) {
            console.error('Error fetching directory:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredStudents = students.filter(s =>
        s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.hub?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const toggleSelectAll = () => {
        if (selectedStudents.length === filteredStudents.length) {
            setSelectedStudents([])
        } else {
            setSelectedStudents(filteredStudents.map(s => s.id))
        }
    }

    const toggleSelectStudent = (studentId: string) => {
        if (selectedStudents.includes(studentId)) {
            setSelectedStudents(prev => prev.filter(id => id !== studentId))
        } else {
            setSelectedStudents(prev => [...prev, studentId])
        }
    }

    const handleDeleteStudent = async (studentId: string) => {
        if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) return

        try {
            const { error } = await supabase.rpc('delete_user_by_instructor', { target_user_id: studentId })
            if (error) throw error

            setStudents(prev => prev.filter(s => s.id !== studentId))
            toast.success('Student deleted successfully.')
        } catch (error: any) {
            console.error('Error deleting student:', error)
            toast.error('Error deleting student: ' + error.message)
        }
    }

    const handleBulkEnroll = async () => {
        if (!selectedClassId) {
            toast.error('Please select a class.')
            return
        }

        setEnrollLoading(true)
        try {
            const enrollments = selectedStudents.map(studentId => ({
                user_id: studentId,
                class_id: selectedClassId
            }))

            const { error } = await supabase
                .from('enrollments')
                .upsert(enrollments, { onConflict: 'user_id,class_id', ignoreDuplicates: true })

            if (error) throw error

            toast.success(`Successfully enrolled ${selectedStudents.length} students.`)
            setShowEnrollModal(false)
            setSelectedStudents([])
            setSelectedClassId('')
        } catch (error: any) {
            console.error('Error enrolling students:', error)
            toast.error('Error enrolling students: ' + error.message)
        } finally {
            setEnrollLoading(false)
        }
    }

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    if (loading) return <div className="text-center py-8">Loading directory...</div>

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900">Student Directory</h2>

                <div className="flex gap-3 w-full md:w-auto items-center">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 input-field w-full"
                        />
                    </div>

                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value))
                            setCurrentPage(1)
                        }}
                        className="bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 h-[42px]"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>

                    {selectedStudents.length > 0 && (
                        <button
                            onClick={() => setShowEnrollModal(true)}
                            className="btn-primary flex items-center gap-2 whitespace-nowrap h-[42px]"
                        >
                            <UserPlus size={18} /> Enroll ({selectedStudents.length})
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                        <tr>
                            <th className="p-4 w-10">
                                <button onClick={toggleSelectAll} className="text-slate-400 hover:text-indigo-600">
                                    {selectedStudents.length > 0 && selectedStudents.length === filteredStudents.length ? <CheckSquare size={20} /> : <Square size={20} />}
                                </button>
                            </th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Hub</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredStudents.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">No students found.</td>
                            </tr>
                        ) : (
                            currentStudents.map(student => (
                                <tr key={student.id} className={`hover:bg-slate-50 transition-colors ${selectedStudents.includes(student.id) ? 'bg-indigo-50/30' : ''}`}>
                                    <td className="p-4">
                                        <button onClick={() => toggleSelectStudent(student.id)} className={`text-slate-400 hover:text-indigo-600 ${selectedStudents.includes(student.id) ? 'text-indigo-600' : ''}`}>
                                            {selectedStudents.includes(student.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                                        </button>
                                    </td>
                                    <td className="p-4 font-medium text-slate-900">{student.full_name}</td>
                                    <td className="p-4 text-slate-500">{student.email}</td>
                                    <td className="p-4">
                                        {student.hub && (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                                {student.hub}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleDeleteStudent(student.id)}
                                            className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Student"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {filteredStudents.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-white">
                    <div className="text-sm text-slate-500">
                        Showing <span className="font-medium text-slate-900">{indexOfFirstItem + 1}</span> to <span className="font-medium text-slate-900">{Math.min(indexOfLastItem, filteredStudents.length)}</span> of <span className="font-medium text-slate-900">{filteredStudents.length}</span> students
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-medium text-slate-700 px-2">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}


            {/* Enroll Modal */}
            {showEnrollModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Enroll Students</h3>
                            <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <p className="text-slate-600 mb-4">
                            Select a class to enroll <span className="font-bold text-slate-900">{selectedStudents.length}</span> students into:
                        </p>

                        <div className="space-y-4">
                            {classes.length === 0 ? (
                                <div className="text-amber-600 bg-amber-50 p-4 rounded-lg text-sm">
                                    You don't have any classes yet. Create a class first.
                                </div>
                            ) : (
                                <select
                                    className="input-field"
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                >
                                    <option value="">Select a class...</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                                    ))}
                                </select>
                            )}

                            <button
                                onClick={handleBulkEnroll}
                                disabled={enrollLoading || !selectedClassId}
                                className="w-full btn-primary py-3"
                            >
                                {enrollLoading ? 'Enrolling...' : 'Confirm Enrollment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
