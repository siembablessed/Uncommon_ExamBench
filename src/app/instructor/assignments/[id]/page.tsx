'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, FileText, CheckCircle, Clock, Search, Filter, Download, ExternalLink, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface AssignmentSubmission {
    id: string
    assignment_id: string
    student_id: string
    file_url: string
    submitted_at: string
    is_late: boolean
    grade: number | null
    feedback: string | null
    student: { full_name: string, email: string }
}

export default function AssignmentDetailInstructorPage() {
    const supabase = createClient()
    const params = useParams()
    const assignmentId = params.id as string
    const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([])
    const [assignment, setAssignment] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editGrade, setEditGrade] = useState<string>('')
    const [editFeedback, setEditFeedback] = useState<string>('')

    useEffect(() => {
        if (assignmentId) fetchData()
    }, [assignmentId])

    const fetchData = async () => {
        try {
            // Fetch Assignment
            const { data: assignmentData } = await supabase
                .from('assignments')
                .select('*')
                .eq('id', assignmentId)
                .single()

            setAssignment(assignmentData)

            // Fetch Submissions
            const { data: subsData } = await supabase
                .from('assignment_submissions')
                .select('*')
                .eq('assignment_id', assignmentId)

            if (subsData) {
                const studentIds = subsData.map(s => s.student_id)
                const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', studentIds)

                const combined = subsData.map(s => ({
                    ...s,
                    student: profiles?.find(p => p.id === s.student_id) || { full_name: 'Unknown', email: 'unknown' }
                }))
                setSubmissions(combined)
            }
        } catch (error) {
            console.error(error)
            toast.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const startEditing = (sub: AssignmentSubmission) => {
        setEditingId(sub.id)
        setEditGrade(sub.grade?.toString() || '')
        setEditFeedback(sub.feedback || '')
    }

    const cancelEditing = () => {
        setEditingId(null)
        setEditGrade('')
        setEditFeedback('')
    }

    const saveGrade = async (subId: string) => {
        try {
            const gradeNum = parseFloat(editGrade)
            if (isNaN(gradeNum)) {
                toast.error('Please enter a valid number for grade')
                return
            }
            if (gradeNum > assignment.points) {
                toast.error(`Grade cannot exceed max points (${assignment.points})`)
                return
            }

            const { error } = await supabase
                .from('assignment_submissions')
                .update({
                    grade: gradeNum,
                    feedback: editFeedback
                })
                .eq('id', subId)

            if (error) throw error

            setSubmissions(prev => prev.map(s =>
                s.id === subId
                    ? { ...s, grade: gradeNum, feedback: editFeedback }
                    : s
            ))

            toast.success('Grade updated')
            cancelEditing()
        } catch (error) {
            console.error(error)
            toast.error('Failed to save grade')
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    )

    if (!assignment) return <div className="p-8 text-center">Assignment not found.</div>

    return (
        <div className="container mx-auto px-6 py-8 md:max-w-6xl">
            <Link href="/instructor/dashboard" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium text-sm">
                <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
            </Link>

            <div className="card mb-8 bg-gradient-to-r from-emerald-50/50 via-white to-white border-none shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wide">
                                Assignment
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{assignment.title}</h1>
                        <p className="text-slate-600 mb-4 max-w-3xl">{assignment.description || 'No description provided.'}</p>
                    </div>
                </div>
                <div className="flex gap-6 text-sm text-slate-500 mt-4 border-t border-slate-100 pt-4">
                    <span className="flex items-center gap-1"><Clock size={16} /> Due: {new Date(assignment.due_date).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><CheckCircle size={16} /> {submissions.length} Submissions</span>
                    <span className="flex items-center gap-1"><FileText size={16} /> Max Points: {assignment.points}</span>
                </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-4">Student Submissions</h2>

            <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 relative">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">File</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Grade / Feedback</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {submissions.map((sub) => (
                                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="bg-emerald-100 p-1.5 rounded-full mr-3 text-emerald-600">
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{sub.student.full_name}</div>
                                                <div className="text-xs text-slate-500">{sub.student.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-slate-700">{new Date(sub.submitted_at).toLocaleDateString()}</span>
                                            <span className="text-slate-400 text-xs">{new Date(sub.submitted_at).toLocaleTimeString()}</span>
                                            {sub.is_late && (
                                                <span className="text-amber-600 text-[10px] font-bold mt-1">LATE SUBMISSION</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <a href={sub.file_url} target="_blank" className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 hover:underline font-medium">
                                            <FileText size={16} />
                                            View File
                                            <ExternalLink size={12} />
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {editingId === sub.id ? (
                                            <div className="flex flex-col gap-2 min-w-[200px]">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={editGrade}
                                                        onChange={e => setEditGrade(e.target.value)}
                                                        className="w-20 px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                        placeholder="0"
                                                    />
                                                    <span className="text-slate-400">/ {assignment.points}</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={editFeedback}
                                                    onChange={e => setEditFeedback(e.target.value)}
                                                    className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                    placeholder="Feedback..."
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                {sub.grade !== null ? (
                                                    <div>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="font-bold text-slate-900">{sub.grade}</span>
                                                            <span className="text-slate-400">/ {assignment.points}</span>
                                                        </div>
                                                        {sub.feedback && <p className="text-slate-500 text-xs italic mt-1 truncate max-w-[200px]">{sub.feedback}</p>}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Not graded</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {editingId === sub.id ? (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => saveGrade(sub.id)}
                                                    className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors"
                                                    title="Save"
                                                >
                                                    <Save size={16} />
                                                </button>
                                                <button
                                                    onClick={cancelEditing}
                                                    className="p-1.5 bg-slate-50 text-slate-500 rounded hover:bg-slate-100 transition-colors"
                                                    title="Cancel"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => startEditing(sub)}
                                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold"
                                            >
                                                {sub.grade !== null ? 'Edit Grade' : 'Grade'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {submissions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No submissions yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
