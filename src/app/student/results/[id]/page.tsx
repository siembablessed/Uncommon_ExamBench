'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText, AlertCircle, Filter, PieChart } from 'lucide-react'
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
    const supabase = createClient()
    const params = useParams()
    const router = useRouter()
    const [data, setData] = useState<ResultsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [showIncorrectOnly, setShowIncorrectOnly] = useState(false)

    useEffect(() => {
        const fetchResults = async () => {
            if (!params.id) return

            try {
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
            } finally {
                setLoading(false)
            }
        }

        fetchResults()
    }, [params.id])

    if (loading) return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
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

    // Calculate stats
    const totalQuestions = exam.questions.length
    let correctCount = 0
    exam.questions.forEach((q, i) => {
        const studentAnswer = submission.content[q.id] || submission.content[i.toString()] || submission.content[i]
        if (studentAnswer === q.correctAnswer) correctCount++
    })
    const incorrectCount = totalQuestions - correctCount


    const questionsWithIndex = exam.questions.map((q: any, i: number) => ({ ...q, originalIndex: i }))

    const filteredQuestions = showIncorrectOnly
        ? questionsWithIndex.filter((q: any) => {
            const studentAnswer = submission.content[q.id] || submission.content[q.originalIndex.toString()] || submission.content[q.originalIndex]
            return studentAnswer !== q.correctAnswer
        })
        : questionsWithIndex

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="container mx-auto max-w-5xl">
                <Link href="/student/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors">
                    <ArrowLeft size={20} /> Back to Dashboard
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Summary Card */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                        <div className={`absolute top-0 left-0 w-2 h-full ${isPass ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 mb-2">{exam.title}</h1>
                                    <p className="text-slate-600 text-sm line-clamp-2">{exam.description}</p>
                                </div>
                                <div className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 ${isPass ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                    {isPass ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                    {isPass ? 'Passed' : 'Needs Work'}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                                <div>
                                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Score</div>
                                    <div className={`text-3xl font-extrabold ${isPass ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {submission.grade?.toFixed(0)}%
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Correct</div>
                                    <div className="text-3xl font-extrabold text-slate-900">
                                        {correctCount}<span className="text-lg text-slate-400 font-medium">/{totalQuestions}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Submitted</div>
                                    <div className="text-sm font-semibold text-slate-700 mt-2">
                                        {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Analytics / Legend */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <PieChart size={18} className="text-indigo-600" /> Performance
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600">Correct Answers</span>
                                    <span className="font-bold text-slate-900">{Math.round((correctCount / totalQuestions) * 100)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(correctCount / totalQuestions) * 100}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600">Incorrect Answers</span>
                                    <span className="font-bold text-slate-900">{Math.round((incorrectCount / totalQuestions) * 100)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-red-500 h-full rounded-full" style={{ width: `${(incorrectCount / totalQuestions) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Review Section */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-4 z-20">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2 sm:mb-0">
                            <FileText size={20} className="text-indigo-600" />
                            Exam Review
                            <span className="text-xs font-normal text-slate-500 ml-2 bg-slate-100 px-2 py-0.5 rounded-full">
                                {filteredQuestions.length} Questions
                            </span>
                        </h2>

                        <button
                            onClick={() => setShowIncorrectOnly(!showIncorrectOnly)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${showIncorrectOnly
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            <Filter size={16} />
                            {showIncorrectOnly ? 'Show All Questions' : 'Show Incorrect Only'}
                        </button>
                    </div>

                    {filteredQuestions.length === 0 ? (
                        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                {showIncorrectOnly ? <CheckCircle size={32} /> : <FileText size={32} />}
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">
                                {showIncorrectOnly ? 'Great Job!' : 'No questions found.'}
                            </h3>
                            <p className="text-slate-500">
                                {showIncorrectOnly
                                    ? 'You answered all questions correctly. No incorrect answers to review.'
                                    : 'There are no questions available for this exam.'}
                            </p>
                            {showIncorrectOnly && (
                                <button
                                    onClick={() => setShowIncorrectOnly(false)}
                                    className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                                >
                                    Show all questions
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredQuestions.map((question: any, index: number) => {
                            // Find original index if filtered (not perfect but acceptable for review)
                            // A better way would be to store original index in the mapped object if order matters strictly
                            // But here we just iterate filtered. Let's try to find original index for display "Question #X"
                            const originalIndex = question.originalIndex

                            const studentAnswer = submission.content[question.id] || submission.content[originalIndex.toString()] || submission.content[originalIndex]
                            const isCorrect = studentAnswer === question.correctAnswer

                            return (
                                <div key={question.id} className={`bg-white rounded-xl shadow-sm border p-6 transition-all ${isCorrect ? 'border-emerald-100 hover:border-emerald-200' : 'border-red-100 hover:border-red-200'
                                    }`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border ${isCorrect ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                                            }`}>
                                            {originalIndex + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                                                <h3 className="text-lg font-medium text-slate-900 leading-snug">{question.text}</h3>
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 ${isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                                    }`}>
                                                    {isCorrect ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                    {isCorrect ? 'Correct' : 'Incorrect'}
                                                </span>
                                            </div>

                                            <div className="space-y-3">
                                                {question.options.map((option) => {
                                                    const isSelected = option === studentAnswer
                                                    const isTheCorrectAnswer = option === question.correctAnswer

                                                    let containerClass = "p-3.5 rounded-xl border flex justify-between items-center transition-all "
                                                    let icon = null;

                                                    if (isSelected && isTheCorrectAnswer) {
                                                        // Correct Selection
                                                        containerClass += "bg-emerald-50 border-emerald-200 text-emerald-900 font-medium"
                                                        icon = <CheckCircle size={18} className="text-emerald-600" />
                                                    } else if (isSelected && !isTheCorrectAnswer) {
                                                        // Wrong Selection
                                                        containerClass += "bg-red-50 border-red-200 text-red-900 font-medium"
                                                        icon = <XCircle size={18} className="text-red-500" />
                                                    } else if (!isSelected && isTheCorrectAnswer) {
                                                        // Correct Answer (Missed)
                                                        containerClass += "bg-emerald-50/50 border-emerald-200 border-dashed text-emerald-800"
                                                        icon = <CheckCircle size={18} className="text-emerald-500 opacity-70" />
                                                    } else {
                                                        // Neutral
                                                        containerClass += "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                                                    }

                                                    return (
                                                        <div key={option} className={containerClass}>
                                                            <span>{option}</span>
                                                            <div className="flex items-center gap-2">
                                                                {isSelected && (
                                                                    <span className={`text-xs font-bold uppercase tracking-wide ${isTheCorrectAnswer ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                        You
                                                                    </span>
                                                                )}
                                                                {!isSelected && isTheCorrectAnswer && (
                                                                    <span className="text-xs font-bold uppercase tracking-wide text-emerald-600 opacity-75">
                                                                        Answer
                                                                    </span>
                                                                )}
                                                                {icon}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            {/* Logic explaination placeholder if we had it */}
                                            {!isCorrect && (
                                                <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100 flex gap-2">
                                                    <AlertCircle size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                                    <div>
                                                        <span className="font-semibold text-slate-700">Review Note:</span> The correct answer is highlighted in green.
                                                    </div>
                                                </div>
                                            )}
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
