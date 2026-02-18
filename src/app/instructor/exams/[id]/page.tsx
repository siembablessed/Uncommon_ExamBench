'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, FileText, CheckCircle, Clock, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react'

// Mocking use object for now if type issues, but keeping it clean
interface Submission {
    id: string
    student_id: string
    submitted_at: string
    status: string
    grade: number | null
    student: { full_name: string, email: string }
    content: string // URL or text
    answers: any // JSONB
    feedback: string
}

// ... existing code ...


export default function ExamDetailInstructorPage() {
    const params = useParams()
    const examId = params.id as string
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [exam, setExam] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (examId) fetchData()
    }, [examId])

    const fetchData = async () => {
        try {
            // Fetch Exam Details
            const { data: examData } = await supabase
                .from('exams')
                .select('*')
                .eq('id', examId)
                .single()

            setExam(examData)

            // Fetch Submissions with Student Profiles
            const { data: subsData, error } = await supabase
                .from('submissions')
                .select(`
          *,
          student:student_id ( full_name, role )
        `) // Note: joined query depends on foreign key name
                .eq('exam_id', examId)

            // If foreign key reference logic is tricky in client without types, we might need to adjust
            // But standard Supabase query returns nested object if relation exists
            // For now assuming `student_id` references `profiles`

            // Workaround if standard join fails on setup: fetch all profiles and map manually
            // But let's try the direct join first.

            // Actually standard join syntax is `student:profiles(...)` if foreign key is explicit
            // Let's retry with simpler query if that fails or just fetch profiles separately if needed.
            // But let's assume it works for now.

            if (subsData) {
                // Need to fetch profile names manually if join is complex
                // Let's do a second fetch to be safe
                const studentIds = subsData.map(s => s.student_id)
                const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', studentIds)

                const combined = subsData.map(s => ({
                    ...s,
                    student: profiles?.find(p => p.id === s.student_id) || { full_name: 'Unknown' }
                }))
                setSubmissions(combined)
            }

        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(5)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'graded' | 'submitted'>('all')

    // Filter Logic
    const filteredSubmissions = submissions.filter(sub => {
        const matchesSearch =
            sub.student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.student.email?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus =
            filterStatus === 'all' ? true :
                filterStatus === 'graded' ? sub.status === 'graded' :
                    sub.status !== 'graded' // 'submitted' means pending grading

        return matchesSearch && matchesStatus
    })

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentSubmissions = filteredSubmissions.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage)

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]" suppressHydrationWarning>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" suppressHydrationWarning></div>
        </div>
    )
    if (!exam) return <div className="p-8 text-center">Exam not found.</div>

    return (
        <div className="container mx-auto px-6 py-8 md:max-w-5xl">
            <Link href="/instructor/dashboard" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium text-sm">
                <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
            </Link>

            <div className="card mb-8 border-l-4 border-l-indigo-500">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{exam.title}</h1>
                        <p className="text-slate-600 mb-4 text-lg">{exam.description || 'No description provided.'}</p>
                    </div>
                    {exam.file_url && (
                        <a href={exam.file_url} target="_blank" className="btn-secondary flex items-center gap-2 text-sm">
                            <FileText size={16} /> View Question Paper
                        </a>
                    )}
                </div>
                <div className="flex gap-6 text-sm text-slate-500 mt-4 border-t border-slate-100 pt-4">
                    <span className="flex items-center gap-1"><Clock size={16} /> Due: {new Date(exam.due_date).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><CheckCircle size={16} /> {submissions.length} Submissions</span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-slate-900">Student Submissions</h2>

                <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center w-full md:w-auto">
                    {/* Search */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={14} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-48"
                        />
                    </div>

                    {/* Filter Status */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select
                                value={filterStatus}
                                onChange={(e) => {
                                    setFilterStatus(e.target.value as any)
                                    setCurrentPage(1)
                                }}
                                className="pl-8 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                            >
                                <option value="all">All Status</option>
                                <option value="graded">Graded</option>
                                <option value="submitted">Ungraded</option>
                            </select>
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                <Filter size={14} className="text-slate-400" />
                            </div>
                        </div>
                    </div>

                    {/* Entries Selector */}
                    <div className="flex items-center gap-2 text-sm text-slate-600 ml-auto sm:ml-0">
                        <span>Show</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value))
                                setCurrentPage(1) // Reset to first page
                            }}
                            className="bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-1.5"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                        <span>entries</span>
                    </div>
                </div>
            </div>

            <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 relative">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted At</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Content</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Grade</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {currentSubmissions.map((sub) => (
                                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="bg-indigo-100 p-1.5 rounded-full mr-3 text-indigo-600">
                                                <User size={16} />
                                            </div>
                                            <span className="font-medium text-slate-900">{sub.student.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {new Date(sub.submitted_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${sub.status === 'graded'
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                                            }`}>
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-medium">
                                        {sub.content?.startsWith('http') ? (
                                            <a href={sub.content} target="_blank" className="hover:underline flex items-center gap-1">
                                                <FileText size={14} /> View File
                                            </a>
                                        ) : (
                                            <span className="text-slate-500 italic font-normal" title={sub.content}>
                                                {sub.content ? (sub.content.length > 30 ? sub.content.substring(0, 30) + '...' : sub.content) : 'No content'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono flex items-center gap-2">
                                        {sub.grade !== null ? (
                                            <span className="font-bold">{sub.grade}%</span>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                        <Link
                                            href={`/instructor/exams/${examId}/submissions/${sub.id}`}
                                            className="btn-secondary text-xs py-1 px-3 ml-2"
                                        >
                                            Review
                                        </Link>
                                        {sub.status !== 'graded' && sub.content && !sub.content.startsWith('http') && (
                                            <AutoGradeButton
                                                submission={sub}
                                                examTitle={exam.title}
                                                onGraded={(grade) => {
                                                    // Optimistic update
                                                    setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, grade, status: 'graded' } : s))
                                                }}
                                            />
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {currentSubmissions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        {submissions.length === 0 ? 'No submissions yet.' : 'No results matching your filters.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {filteredSubmissions.length > 0 ? (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
                        <div className="text-sm text-slate-500">
                            Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, filteredSubmissions.length)}</span> of <span className="font-medium">{filteredSubmissions.length}</span> results
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
                ) : null}
            </div>
        </div>
    )
}

function AutoGradeButton({ submission, examTitle, onGraded }: { submission: any, examTitle: string, onGraded: (grade: number) => void }) {
    const [grading, setGrading] = useState(false)

    const handleAutoGrade = async () => {
        setGrading(true)
        try {
            const res = await fetch('/api/ai/grade-exam', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: `Exam Question for ${examTitle}. (Rubric implicit in context)`,
                    rubric: "Grade the student's answer fairly based on standard academic criteria.",
                    studentAnswer: submission.content
                })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            // Save grade to supabase
            const { error } = await supabase
                .from('submissions')
                .update({ grade: data.grade, feedback: data.feedback, status: 'graded' })
                .eq('id', submission.id)

            if (error) throw error

            alert(`AI Graded: ${data.grade}/100\nFeedback: ${data.feedback}`)
            onGraded(data.grade)

        } catch (error: any) {
            alert('Grading failed: ' + error.message)
        } finally {
            setGrading(false)
        }
    }

    return (
        <button
            onClick={handleAutoGrade}
            disabled={grading}
            className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded hover:bg-violet-200 border border-violet-200 transition-colors flex items-center gap-1"
            title="Auto-grade with AI"
        >
            {grading ? <div className="animate-spin h-3 w-3 border-b-2 border-violet-700 rounded-full"></div> : '✨ Auto-Grade'}
        </button>
    )
}
