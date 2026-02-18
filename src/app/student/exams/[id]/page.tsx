'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Clock, CheckCircle, FileText, AlertCircle } from 'lucide-react'
import ExamTimer from '@/components/ExamTimer'
import confetti from 'canvas-confetti'

import { toast } from 'sonner' // Add import

export default function StudentExamPage() {
    const { id } = useParams()
    const router = useRouter()
    const [exam, setExam] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [submitted, setSubmitted] = useState(false)
    const [submissionData, setSubmissionData] = useState<any>(null)
    const [answerText, setAnswerText] = useState('')
    const [mcqAnswers, setMcqAnswers] = useState<Record<number, string>>({})
    const [duration, setDuration] = useState<number | null>(null)

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

    useEffect(() => {
        fetchExam()
    }, [id])

    const fetchExam = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data, error } = await supabase
                .from('exams')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            setExam(data)
            if (data.duration_minutes) setDuration(data.duration_minutes)

            // Check if already submitted
            const { data: sub } = await supabase
                .from('submissions')
                .select('*')
                .eq('exam_id', id)
                .eq('student_id', user.id)
                .single()

            if (sub) {
                setSubmitted(true)
                setSubmissionData(sub)
            }

        } catch (error: any) {
            console.error('Error fetching exam:', error)
            toast.error('Failed to load exam.')
        } finally {
            setLoading(false)
        }
    }

    const handleOptionSelect = (questionIndex: number, option: string) => {
        setMcqAnswers(prev => ({
            ...prev,
            [questionIndex]: option
        }))
    }

    const handleNext = () => {
        if (currentQuestionIndex < exam.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        }
    }

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1)
        }
    }

    const handleTimeUp = () => {
        if (!submitted) {
            toast.warning('Time is up! Your exam is being submitted automatically.')
            handleSubmit(new Event('submit') as any, true)
        }
    }

    const handleSubmit = async (e: React.FormEvent | any, isAuto = false) => {
        if (e && e.preventDefault) e.preventDefault()

        const hasQuestions = exam.questions && exam.questions.length > 0

        // Validation (skip if auto-submit)
        if (!isAuto && hasQuestions) {
            const answeredCount = Object.keys(mcqAnswers).length
            if (answeredCount < exam.questions.length) {
                if (!confirm(`You have answered ${answeredCount} out of ${exam.questions.length} questions. Are you sure you want to submit?`)) return
            }
        }

        if (!isAuto && !hasQuestions && !answerText.trim()) {
            toast.error('Please enter your answer.')
            return
        }

        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not found')

            const submission = {
                exam_id: id,
                student_id: user.id,
                submitted_at: new Date().toISOString(),
                answers: hasQuestions ? mcqAnswers : { text: answerText },
                grade: null as number | null
            }

            // Auto-grading logic for MCQ
            if (hasQuestions) {
                let correctCount = 0
                exam.questions.forEach((q: any, i: number) => {
                    if (mcqAnswers[i] === q.correctAnswer) {
                        correctCount++
                    }
                })
                submission.grade = (correctCount / exam.questions.length) * 100
            }

            const { data: newSub, error } = await supabase
                .from('submissions')
                .insert(submission)
                .select()
                .single()

            if (error) throw error

            setSubmitted(true)
            setSubmissionData(newSub)

            if (hasQuestions) {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
            }

            if (!isAuto) toast.success('Exam submitted successfully!')

        } catch (error: any) {
            if (error.code === '23505') {
                setSubmitted(true) // Already submitted
            } else {
                toast.error('Submission failed: ' + error.message)
            }
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    )
    if (!exam) return <div className="p-8 text-center">Exam not found.</div>

    // Check if overdue
    const isOverdue = new Date() > new Date(exam.due_date)

    if (isOverdue && !submitted) return (
        <div className="container mx-auto px-6 py-8">
            <Link href="/student/dashboard" className="flex items-center text-slate-500 hover:text-slate-900 mb-6 transition-colors">
                <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
            </Link>
            <div className="card max-w-2xl mx-auto text-center py-12">
                <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock size={40} className="text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Exam Closed</h1>
                <p className="text-slate-500 mb-8">
                    The due date for <strong>{exam.title}</strong> has passed.
                </p>
                <div className="text-sm text-slate-400 bg-slate-50 inline-block px-4 py-2 rounded">
                    Due: {new Date(exam.due_date).toLocaleString()}
                </div>
            </div>
        </div>
    )

    const hasQuestions = exam.questions && exam.questions.length > 0
    const hasPdf = !!exam.file_url
    const currentQuestion = hasQuestions ? exam.questions[currentQuestionIndex] : null

    return (
        <div className="container mx-auto px-4 py-6 h-[calc(100vh-64px)] flex flex-col" suppressHydrationWarning>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/student/dashboard" className="text-slate-500 hover:text-slate-900 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 leading-tight">{exam.title}</h1>
                        <div className="text-xs text-slate-500">
                            Due: {new Date(exam.due_date).toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {duration && !submitted && (
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Time Remaining</span>
                            <ExamTimer durationMinutes={duration} onTimeUp={handleTimeUp} />
                        </div>
                    )}
                </div>
            </div>

            {submitted ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="max-w-2xl text-center animate-in zoom-in duration-300">
                        <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={48} className="text-emerald-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Exam Submitted!</h2>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">
                            Your exam has been successfully recorded.
                            {submissionData?.grade !== null && (
                                <span className="block mt-2 font-medium text-indigo-600">
                                    You scored: {submissionData.grade?.toFixed(1)}%
                                </span>
                            )}
                        </p>
                        <Link href="/student/dashboard" className="btn-primary inline-flex items-center gap-2">
                            <ArrowLeft size={18} /> Return to Dashboard
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                    {/* Left Panel: PDF (Only if no interactive questions) */}
                    {hasPdf && !hasQuestions && (
                        <div className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex flex-col flex-1">
                            <iframe src={`${exam.file_url}#toolbar=0`} className="w-full h-full bg-white" title="Exam PDF" />
                        </div>
                    )}

                    {/* Right Panel: Content */}
                    <div className={`flex flex-col gap-6 overflow-y-auto ${hasPdf && !hasQuestions ? 'w-[400px] shrink-0' : 'flex-1 max-w-3xl mx-auto w-full'}`}>

                        {!hasQuestions && !hasPdf && (
                            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-4">Instructions</h3>
                                <p className="whitespace-pre-wrap text-slate-700 leading-relaxed font-serif">{exam.description}</p>
                            </div>
                        )}

                        {hasQuestions ? (
                            <form onSubmit={handleSubmit} className="flex flex-col h-full gap-4">
                                {/* Question Card */}
                                <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-6">
                                        <span className="bg-indigo-50 text-indigo-700 text-sm font-bold px-3 py-1 rounded-full border border-indigo-100">
                                            Question {currentQuestionIndex + 1} of {exam.questions.length}
                                        </span>
                                        <span className="text-slate-400 text-sm">
                                            {Object.keys(mcqAnswers).length} answered
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-medium text-slate-900 mb-8 leading-relaxed">
                                        {currentQuestion.text || currentQuestion.question}
                                    </h3>

                                    <div className="space-y-4">
                                        {currentQuestion.options?.map((opt: string, idx: number) => (
                                            <label
                                                key={idx}
                                                className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-slate-50 ${mcqAnswers[currentQuestionIndex] === opt
                                                        ? 'bg-indigo-50 border-indigo-500 shadow-sm'
                                                        : 'bg-white border-slate-100'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-colors ${mcqAnswers[currentQuestionIndex] === opt
                                                        ? 'border-indigo-600 bg-indigo-600'
                                                        : 'border-slate-300'
                                                    }`}>
                                                    {mcqAnswers[currentQuestionIndex] === opt && <div className="w-2 h-2 bg-white rounded-full" />}
                                                </div>
                                                <input
                                                    type="radio"
                                                    name={`question-${currentQuestionIndex}`}
                                                    value={opt}
                                                    checked={mcqAnswers[currentQuestionIndex] === opt}
                                                    onChange={() => handleOptionSelect(currentQuestionIndex, opt)}
                                                    className="hidden"
                                                />
                                                <span className={`text-lg ${mcqAnswers[currentQuestionIndex] === opt ? 'text-indigo-900 font-medium' : 'text-slate-700'}`}>
                                                    {opt}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Navigation Bar */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center sticky bottom-0">
                                    <button
                                        type="button"
                                        onClick={handlePrev}
                                        disabled={currentQuestionIndex === 0}
                                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${currentQuestionIndex === 0
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
                                            }`}
                                    >
                                        Previous
                                    </button>

                                    {currentQuestionIndex === exam.questions.length - 1 ? (
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                                        >
                                            {loading ? 'Submitting...' : 'Submit Exam'} <CheckCircle size={18} />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                        >
                                            Next Question
                                        </button>
                                    )}
                                </div>
                            </form>
                        ) : (
                            // Text Answer Layout (unchanged mainly, just wrapper)
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
                                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Send size={18} className="text-indigo-600" /> Your Answer
                                </h3>
                                <textarea
                                    className="flex-1 w-full p-4 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 mb-4 font-mono text-sm leading-relaxed"
                                    placeholder="Type your answers here..."
                                    value={answerText}
                                    onChange={e => setAnswerText(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading || !answerText.trim()}
                                    className="w-full btn-primary py-3"
                                >
                                    {loading ? 'Submitting...' : 'Submit Exam'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function ExternalLinkIcon({ href }: { href: string }) {
    return (
        <a href={href} target="_blank" className="text-indigo-600 hover:text-indigo-800">
            <FileText size={16} />
        </a>
    )
}
