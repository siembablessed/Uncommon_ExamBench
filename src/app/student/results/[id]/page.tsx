'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Question {
    id: string
    text: string
    options: string[]
    correctAnswer: string
    points: number
}

interface ResultsData {
    submission: {
        id: string
        grade: number
        status: string
        submitted_at: string
        content: Record<string, string> // Map of questionId -> selectedOption
        feedback: any
    }
    exam: {
        title: string
        description: string
        questions: Question[]
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
                // Fetch submission with exam details AND questions
                // Note: We assume questions are stored in the 'questions' column of the 'exams' table based on typical pattern here.
                // If strictly relational, we'd adjust. But previous context suggests JSON or simple structure.
                const { data: submissionData, error } = await supabase
                    .from('submissions')
                    .select(`
                        id, grade, status, submitted_at, answers, content, feedback,
                        exams (title, description, questions)
                    `)
                    .eq('id', params.id)
                    .single()

                if (error) {
                    console.error('Supabase Error:', error)
                    throw error
                }

                if (submissionData) {
                    const examData = Array.isArray(submissionData.exams) ? submissionData.exams[0] : submissionData.exams

                    const safeParse = (data: any, fallback: any = {}) => {
                        if (!data) return fallback
                        if (typeof data === 'object') return data
                        try {
                            return JSON.parse(data)
                        } catch (e) {
                            console.warn('JSON Parse Error:', e, data)
                            return fallback
                        }
                    }

                    // Handle legacy 'content' vs new 'answers' column
                    // StudentExamPage writes to 'answers' keyed by index
                    const rawAnswers = submissionData.answers || submissionData.content
                    const parsedAnswers = safeParse(rawAnswers, {})

                    setData({
                        submission: {
                            id: submissionData.id,
                            grade: submissionData.grade,
                            status: submissionData.status,
                            submitted_at: submissionData.submitted_at,
                            content: parsedAnswers,
                            feedback: safeParse(submissionData.feedback, null)
                        },
                        exam: {
                            title: examData?.title || 'Unknown Exam',
                            description: examData?.description || '',
                            questions: safeParse(examData?.questions, [])
                        }
                    })
                }
            } catch (err) {
                console.error('Error fetching results:', err)
                // Don't leave user in loading state, show error
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
            <p className="text-slate-500 mb-6">We couldn't load the results for this exam. It might have been deleted or you don't have permission to view it.</p>
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

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    {/* Header: Score and Status */}
                    <div className={`p-8 ${isPass ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-red-50 border-b border-red-100'}`}>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">{exam.title}</h1>
                                <p className="text-slate-600 mb-4">{exam.description}</p>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className={`flex items-center gap-1 font-medium ${isPass ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {isPass ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                        {isPass ? 'Passed' : 'Needs Improvement'}
                                    </span>
                                    <span className="text-slate-500 flex items-center gap-1">
                                        <Clock size={14} /> Submitted on {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'N/A'}
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
                </div>

                {/* Review Section */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText size={20} className="text-indigo-600" /> Exam Review
                    </h2>

                    {exam.questions.length === 0 ? (
                        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
                            No questions found for this exam.
                        </div>
                    ) : (
                        exam.questions.map((question, index) => {
                            // Try lookup by ID first, then by index
                            // StudentExamPage saves by index (as number keys in JSON)
                            const studentAnswer = submission.content[question.id] || submission.content[index.toString()] || submission.content[index]
                            const isCorrect = studentAnswer === question.correctAnswer

                            return (
                                <div key={question.id} className={`bg-white rounded-xl shadow-sm border p-6 ${isCorrect ? 'border-emerald-100' : 'border-red-100'
                                    }`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-lg font-medium text-slate-900">{question.text}</h3>
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                                    }`}>
                                                    {isCorrect ? 'Correct' : 'Incorrect'}
                                                </span>
                                            </div>

                                            <div className="space-y-3">
                                                {question.options.map((option) => {
                                                    const isSelected = option === studentAnswer
                                                    const isTheCorrectAnswer = option === question.correctAnswer

                                                    let optionClass = "p-3 rounded-lg border text-sm flex justify-between items-center "

                                                    if (isSelected && isTheCorrectAnswer) {
                                                        optionClass += "bg-emerald-50 border-emerald-200 text-emerald-800 font-medium"
                                                    } else if (isSelected && !isTheCorrectAnswer) {
                                                        optionClass += "bg-red-50 border-red-200 text-red-800 font-medium"
                                                    } else if (!isSelected && isTheCorrectAnswer) {
                                                        optionClass += "bg-emerald-50/50 border-emerald-100/50 text-emerald-600 border-dashed"
                                                    } else {
                                                        optionClass += "bg-white border-slate-100 text-slate-600"
                                                    }

                                                    return (
                                                        <div key={option} className={optionClass}>
                                                            <span>{option}</span>
                                                            {isSelected && (
                                                                <span className="text-xs font-bold">Your Answer</span>
                                                            )}
                                                            {!isSelected && isTheCorrectAnswer && (
                                                                <span className="text-xs font-medium flex items-center gap-1">
                                                                    <CheckCircle size={12} /> Correct Answer
                                                                </span>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* AI Feedback Section (Optional, if exists) */}
                {submission.feedback && (
                    <div className="mt-8 bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                        <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                            <AlertCircle size={18} /> Additional Feedback
                        </h3>
                        <div className="prose prose-sm text-indigo-800">
                            {/* Handle string or object feedback */}
                            {typeof submission.feedback === 'string'
                                ? submission.feedback
                                : Array.isArray(submission.feedback)
                                    ? "See detailed breakdown above."
                                    : JSON.stringify(submission.feedback)
                            }
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
