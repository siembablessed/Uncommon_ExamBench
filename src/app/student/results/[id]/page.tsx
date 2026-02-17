'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText } from 'lucide-react'
import Link from 'next/link'

interface ResultsData {
    submission: {
        id: string
        grade: number
        status: string
        submitted_at: string
        content: any // JSON answers
        feedback: any // JSON feedback from AI/Instructor
    }
    exam: {
        title: string
        description: string
        total_questions: number
    }
}

export default function ExamResultsPage() {
    const params = useParams()
    const router = useRouter()
    const [data, setData] = useState<ResultsData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchResults = async () => {
            if (!params.id) return

            try {
                // Fetch submission with exam details
                const { data: submissionData, error } = await supabase
                    .from('submissions')
                    .select(`
                        id, grade, status, submitted_at, content, feedback,
                        exams (title, description)
                    `)
                    .eq('id', params.id)
                    .single()

                if (error) throw error

                if (submissionData) {
                    setData({
                        submission: {
                            id: submissionData.id,
                            grade: submissionData.grade,
                            status: submissionData.status,
                            submitted_at: submissionData.submitted_at,
                            content: typeof submissionData.content === 'string'
                                ? JSON.parse(submissionData.content)
                                : submissionData.content,
                            feedback: typeof submissionData.feedback === 'string'
                                ? JSON.parse(submissionData.feedback)
                                : submissionData.feedback
                        },
                        exam: {
                            title: Array.isArray(submissionData.exams) ? (submissionData.exams[0] as any)?.title : (submissionData.exams as any)?.title,
                            description: Array.isArray(submissionData.exams) ? (submissionData.exams[0] as any)?.description : (submissionData.exams as any)?.description,
                            total_questions: 0 // We'll calculate this from content if possible
                        }
                    })
                }
            } catch (err) {
                console.error('Error fetching results:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchResults()
    }, [params.id])

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    )

    if (!data) return (
        <div className="container mx-auto px-6 py-12 text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Results Not Found</h1>
            <Link href="/student/dashboard" className="text-indigo-600 hover:dashed">Back to Dashboard</Link>
        </div>
    )

    const { submission, exam } = data
    const isPass = (submission.grade || 0) >= 50

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="container mx-auto max-w-4xl">
                <Link href="/student/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors">
                    <ArrowLeft size={20} /> Back to Dashboard
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Header: Score and Status */}
                    <div className={`p-8 ${isPass ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-red-50 border-b border-red-100'}`}>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">{exam.title}</h1>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className={`flex items-center gap-1 font-medium ${isPass ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {isPass ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                        {isPass ? 'Passed' : 'Needs Improvement'}
                                    </span>
                                    <span className="text-slate-500 flex items-center gap-1">
                                        <Clock size={14} /> Submitted on {new Date(submission.submitted_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="text-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 min-w-[120px]">
                                <div className={`text-4xl font-extrabold ${isPass ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {submission.grade}%
                                </div>
                                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Final Score</div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Feedback */}
                    <div className="p-8">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <FileText size={20} className="text-indigo-600" /> Assessment Feedback
                        </h2>

                        {submission.feedback ? (
                            <div className="space-y-6">
                                {/* If feedback is structured (e.g. from AI) */}
                                {Array.isArray(submission.feedback) ? (
                                    submission.feedback.map((item: any, idx: number) => (
                                        <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-slate-900">Question {idx + 1}</h3>
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${item.correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                    {item.correct ? 'Correct' : 'Incorrect'}
                                                </span>
                                            </div>
                                            <p className="text-slate-700 mb-2">{item.question}</p>
                                            <div className="text-sm bg-white p-3 rounded border border-slate-200 text-slate-600">
                                                <span className="font-semibold text-slate-900">Feedback: </span>
                                                {item.feedback}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    // Plain text feedback
                                    <div className="prose text-slate-700">
                                        <p>{JSON.stringify(submission.feedback, null, 2)}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-500">No detailed feedback available for this submission.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
