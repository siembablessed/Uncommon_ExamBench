'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Save, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function SubmissionDetailsPage() {
    const supabase = createClient()
    const params = useParams()
    const examId = params.id as string
    const submissionId = params.submissionId as string
    const router = useRouter()

    const [submission, setSubmission] = useState<any>(null)
    const [exam, setExam] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)

    // Editable fields
    const [grade, setGrade] = useState<number | ''>('')
    const [feedback, setFeedback] = useState('')

    useEffect(() => {
        if (submissionId) fetchData()
    }, [submissionId])

    const fetchData = async () => {
        try {
            setLoading(true)

            // Fetch Submission
            const { data: sub, error: subError } = await supabase
                .from('submissions')
                .select(`
                    *,
                    student:student_id ( full_name, email, role )
                `)
                .eq('id', submissionId)
                .single()

            if (subError) throw subError
            setSubmission(sub)
            setGrade(sub.grade ?? '')
            setFeedback(sub.feedback ?? '')

            // Fetch Exam (for questions and correct answers)
            const { data: examData, error: examError } = await supabase
                .from('exams')
                .select('*')
                .eq('id', sub.exam_id)
                .single()

            if (examError) throw examError
            setExam(examData)

        } catch (error: any) {
            console.error('Error fetching data:', error)
            toast.error('Failed to load submission')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateGrade = async () => {
        try {
            setUpdating(true)
            const numGrade = grade === '' ? null : Number(grade)

            if (numGrade !== null && (isNaN(numGrade) || numGrade < 0 || numGrade > 100)) {
                toast.error('Please enter a valid grade (0-100)')
                return
            }

            const { error } = await supabase
                .from('submissions')
                .update({
                    grade: numGrade,
                    feedback: feedback,
                    status: 'graded'
                })
                .eq('id', submissionId)

            if (error) throw error

            toast.success('Grade updated successfully')
            router.refresh() // Refresh to ensure data consistency if navigating back? Maybe not needed for client nav.
        } catch (error: any) {
            toast.error('Failed to update grade: ' + error.message)
        } finally {
            setUpdating(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    )

    if (!submission || !exam) return <div className="p-8 text-center">Submission not found.</div>

    const hasQuestions = exam.questions && exam.questions.length > 0
    const answers = submission.answers || {}

    // Calculate auto-score for reference
    let correctCount = 0
    if (hasQuestions) {
        exam.questions.forEach((q: any, i: number) => {
            if (answers[i] === q.correctAnswer) correctCount++
        })
    }
    const autoScore = hasQuestions ? (correctCount / exam.questions.length) * 100 : 0

    return (
        <div className="container mx-auto px-6 py-8 md:max-w-4xl">
            <Link href={`/instructor/exams/${examId}`} className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium text-sm">
                <ArrowLeft size={18} className="mr-2" /> Back to Submissions
            </Link>

            <div className="card mb-8">
                <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">{exam.title}</h1>
                        <div className="flex items-center gap-2 text-slate-500">
                            <User size={18} />
                            <span className="font-medium text-slate-900">{submission.student?.full_name}</span>
                            <span className="text-slate-400">({submission.student?.email})</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-500 mb-1">Submitted</div>
                        <div className="font-mono text-slate-900">{new Date(submission.submitted_at).toLocaleString()}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Grade Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Final Grade (%)</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={grade}
                                onChange={(e) => setGrade(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-24 p-3 border border-slate-300 rounded-lg text-lg font-bold text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            {hasQuestions && (
                                <div className="text-sm text-slate-500">
                                    (Auto-calculated: <span className="font-bold text-slate-700">{autoScore.toFixed(1)}%</span>)
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Feedback Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Feedback</label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg h-24 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Add feedback for the student..."
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleUpdateGrade}
                        disabled={updating}
                        className="btn-primary py-2 px-6 flex items-center gap-2"
                    >
                        {updating ? 'Saving...' : 'Update Grade'} <Save size={18} />
                    </button>
                </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-4">Response Details</h2>

            <div className="space-y-6">
                {hasQuestions ? (
                    exam.questions.map((q: any, i: number) => {
                        const studentAns = answers[i]
                        const isCorrect = studentAns === q.correctAnswer
                        const isMissed = !studentAns

                        return (
                            <div key={i} className={`card p-6 border-l-4 ${isCorrect ? 'border-l-emerald-500' : isMissed ? 'border-l-slate-300' : 'border-l-red-500'}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <h3 className="font-medium text-slate-900 flex-1">
                                        <span className="font-bold text-slate-400 mr-2">{i + 1}.</span>
                                        {q.text || q.question}
                                    </h3>
                                    <div className="shrink-0 ml-4">
                                        {isCorrect ? (
                                            <span className="flex items-center text-emerald-600 text-sm font-bold bg-emerald-50 px-2 py-1 rounded"><CheckCircle size={16} className="mr-1" /> Correct</span>
                                        ) : isMissed ? (
                                            <span className="flex items-center text-slate-500 text-sm font-bold bg-slate-100 px-2 py-1 rounded"><AlertCircle size={16} className="mr-1" /> No Answer</span>
                                        ) : (
                                            <span className="flex items-center text-red-600 text-sm font-bold bg-red-50 px-2 py-1 rounded"><XCircle size={16} className="mr-1" /> Incorrect</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 pl-6">
                                    {q.options?.map((opt: string, idx: number) => {
                                        const isSelected = studentAns === opt
                                        const isCorrectOpt = q.correctAnswer === opt

                                        let style = "border-slate-200 bg-white"
                                        if (isSelected && isCorrectOpt) style = "border-emerald-500 bg-emerald-50 text-emerald-900"
                                        else if (isSelected && !isCorrectOpt) style = "border-red-500 bg-red-50 text-red-900"
                                        else if (isCorrectOpt) style = "border-emerald-200 bg-emerald-50/50 text-emerald-900 border-dashed"

                                        return (
                                            <div key={idx} className={`p-3 rounded-lg border ${style} flex justify-between items-center`}>
                                                <span>{opt}</span>
                                                {isCorrectOpt && <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Correct Answer</span>}
                                                {isSelected && !isCorrectOpt && <span className="text-xs font-bold uppercase tracking-wider text-red-600">Your Answer</span>}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="card">
                        <h3 className="font-bold text-slate-900 mb-2">Student Answer (Text)</h3>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 font-mono text-sm whitespace-pre-wrap">
                            {submission.content || 'No text content provided.'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
