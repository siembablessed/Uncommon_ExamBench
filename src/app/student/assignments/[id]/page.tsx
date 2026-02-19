'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, FileText, Upload, Clock, AlertTriangle, CheckCircle, Paperclip, File } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import MarkdownView from '@/components/MarkdownView'
import { Assignment, AssignmentSubmission } from '@/types'

export default function StudentAssignmentPage() {
    const params = useParams()
    const router = useRouter()
    const supabase = createClient()
    const [assignment, setAssignment] = useState<Assignment | null>(null)
    const [submission, setSubmission] = useState<AssignmentSubmission | null>(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [agreement, setAgreement] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const assignmentId = params.id as string

    useEffect(() => {
        fetchAssignmentData()
    }, [assignmentId])

    const fetchAssignmentData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Fetch Assignment
            const { data: assignmentData, error: assignError } = await supabase
                .from('assignments')
                .select('*')
                .eq('id', assignmentId)
                .single()

            if (assignError) throw assignError
            setAssignment(assignmentData)

            // 2. Fetch Existing Submission
            const { data: submissionData } = await supabase
                .from('assignment_submissions')
                .select('*')
                .eq('assignment_id', assignmentId)
                .eq('student_id', user.id)
                .single()

            if (submissionData) setSubmission(submissionData)

        } catch (error) {
            console.error('Error fetching assignment:', error)
            toast.error('Failed to load assignment details')
        } finally {
            setLoading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleSubmit = async () => {
        if (!file && !submission) {
            toast.error('Please select a file to upload')
            return
        }
        if (!agreement && !submission) {
            toast.error('You must agree to the honest work policy')
            return
        }

        try {
            setUploading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            let fileUrl = submission?.file_url

            // 1. Upload File (if new file selected)
            if (file) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${user.id}/${assignmentId}/${Date.now()}.${fileExt}`

                const { error: uploadError, data } = await supabase.storage
                    .from('assignments')
                    .upload(fileName, file)

                if (uploadError) throw uploadError

                // Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('assignments')
                    .getPublicUrl(fileName)

                fileUrl = publicUrl
            }

            if (!fileUrl) throw new Error('File upload failed')

            // 2. Calculate Lateness
            const now = new Date()
            const dueDate = new Date(assignment!.due_date)
            const isLate = now > dueDate

            // 3. Insert/Update Submission
            const { error: submitError } = await supabase
                .from('assignment_submissions')
                .upsert({
                    assignment_id: assignmentId,
                    student_id: user.id,
                    file_url: fileUrl,
                    submitted_at: now.toISOString(),
                    is_late: isLate,
                    agreement_confirmed: true,
                    // If previously submitted, preserve specific fields if needed, 
                    // but usually a re-submission updates everything relevant
                })

            if (submitError) throw submitError

            toast.success('Assignment submitted successfully!')
            fetchAssignmentData() // Refresh state
            setFile(null) // Clear file input
            setAgreement(false)

        } catch (error: any) {
            console.error('Error submitting assignment:', error)
            toast.error(error.message || 'Failed to submit assignment')
        } finally {
            setUploading(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    )

    if (!assignment) return (
        <div className="max-w-3xl mx-auto px-6 py-12 text-center">
            <h2 className="text-xl font-bold text-slate-800">Assignment Not Found</h2>
            <Link href="/student/dashboard" className="text-indigo-600 hover:underline mt-2 inline-block">
                Return to Dashboard
            </Link>
        </div>
    )

    const isPastDue = new Date() > new Date(assignment.due_date)
    const formattedDueDate = new Date(assignment.due_date).toLocaleDateString() + ' ' + new Date(assignment.due_date).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })

    return (
        <div className="container mx-auto px-6 py-8 max-w-4xl">
            <Link href="/student/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 bg-slate-50/30">
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wide">
                                    Assignment
                                </span>
                                {submission && (
                                    <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1">
                                        <CheckCircle size={12} /> Submitted
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">{assignment.title}</h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <Clock size={16} className="text-slate-400" />
                                    Due: <span className="font-medium text-slate-700">{formattedDueDate}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <FileText size={16} className="text-slate-400" />
                                    Points: <span className="font-medium text-slate-700">{assignment.points}</span>
                                </span>
                            </div>
                        </div>
                        {isPastDue && !submission && (
                            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 max-w-xs">
                                <p className="text-amber-800 text-xs font-medium flex items-start gap-2">
                                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                    <span>Late Submission Warning: A penalty of {assignment.late_penalty_amount} points may be applied.</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    {/* Instructions */}
                    <div className="md:col-span-2 p-8">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Instructions</h2>
                        <MarkdownView content={assignment.description || 'No instructions provided.'} />
                    </div>

                    {/* Submission Sidebar */}
                    <div className="p-8 bg-slate-50/50">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Your Work</h2>

                        {submission ? (
                            <div className="space-y-4">
                                <div className="bg-white border boundary-slate-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                            <File size={20} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-slate-900 mb-1">submitted_file.docx</p>
                                            <p className="text-xs text-slate-500 mb-2">
                                                Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                                            </p>
                                            <a
                                                href={submission.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                                            >
                                                Download File <Upload size={10} className="rotate-180" />
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {submission.grade !== null ? (
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Grade</h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-slate-900">{submission.grade}</span>
                                            <span className="text-sm text-slate-500">/ {assignment.points}</span>
                                        </div>
                                        {submission.feedback && (
                                            <div className="mt-3 pt-3 border-t border-slate-100">
                                                <p className="text-sm text-slate-600 italic">"{submission.feedback}"</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                        <p className="text-sm text-blue-700 flex items-center gap-2">
                                            <Clock size={16} /> Awaiting Grading
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={() => setSubmission(null)} // Hack to allow re-submission UI (logic handles update)
                                    className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 hover:underline"
                                >
                                    Resubmit Assignment
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Upload File</label>
                                    <div
                                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${file ? 'border-indigo-300 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            onChange={handleFileChange}
                                            accept=".pdf,.doc,.docx,.txt"
                                        />
                                        <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 text-indigo-600">
                                            <Upload size={20} />
                                        </div>
                                        {file ? (
                                            <div>
                                                <p className="text-sm font-medium text-indigo-700 truncate max-w-[200px] mx-auto">{file.name}</p>
                                                <p className="text-xs text-indigo-500 mt-1">Click to change</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">Click to upload</p>
                                                <p className="text-xs text-slate-500 mt-1">PDF, DOCX, or TXT</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="agreement"
                                            type="checkbox"
                                            checked={agreement}
                                            onChange={(e) => setAgreement(e.target.checked)}
                                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                        />
                                    </div>
                                    <label htmlFor="agreement" className="text-xs text-slate-600 leading-relaxed">
                                        I confirm that this submission is my own work and I have not received unauthorized assistance.
                                    </label>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={uploading || !file || !agreement}
                                    className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            Submit Assignment
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
