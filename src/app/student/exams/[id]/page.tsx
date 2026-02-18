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

    const hasQuestions = exam?.questions && exam.questions.length > 0

    // Navigation Guard
    useEffect(() => {
        if (!submitted && (hasQuestions || answerText)) {
            const handleBeforeUnload = (e: BeforeUnloadEvent) => {
                e.preventDefault()
                e.returnValue = '' // Chrome requires returnValue to be set
            }
            window.addEventListener('beforeunload', handleBeforeUnload)
            return () => window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [submitted, hasQuestions, answerText])

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
            console.error('Error Data:', { id, error_message: error.message, error_details: error.details, error_hint: error.hint, code: error.code })
            toast.error(`Failed to load exam: ${error.message || 'Unknown error'}`)
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

    const hasPdf = !!exam.file_url
    const currentQuestion = hasQuestions ? exam.questions[currentQuestionIndex] : null

    const handleExit = (e: React.MouseEvent) => {
        if (!submitted) {
            e.preventDefault()
            const confirmExit = window.confirm('Are you sure you want to leave?\n\nYour exam progress will be lost and the timer will continue running.')
            if (confirmExit) {
                router.push('/student/dashboard')
            }
        }
    }

    return (
        <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden relative" suppressHydrationWarning>

            {/* Floating Controls */}
            {!submitted && (
                <>
                    {/* Top Left: Exit & Title */}
                    <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
                        <button
                            onClick={handleExit}
                            className="bg-white/90 backdrop-blur shadow-sm border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-white p-2 rounded-full transition-all group"
                            title="Exit Exam"
                        >
                            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="bg-white/90 backdrop-blur shadow-sm border border-slate-200 px-3 py-1.5 rounded-full text-xs font-medium text-slate-500 max-w-[200px] truncate hidden sm:block">
                            {exam.title}
                        </div>
                    </div>

                    {/* Top Right: Timer */}
                    {duration && (
                        <div className="absolute top-4 right-4 z-50">
                            <div className="bg-white/90 backdrop-blur shadow-sm border border-slate-200 px-4 py-2 rounded-full flex items-center gap-2 font-mono font-bold text-slate-700 text-sm">
                                <Clock size={16} className="text-indigo-500" />
                                <ExamTimer durationMinutes={duration} onTimeUp={handleTimeUp} />
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Main Content Area */}
            <div className="flex-1 w-full h-full p-4 md:p-6 flex items-center justify-center">

                {submitted ? (
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full text-center animate-in zoom-in duration-300">
                        <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={40} className="text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Exam Submitted!</h2>
                        <p className="text-slate-500 mb-8">
                            Your exam has been recorded.
                            {submissionData?.grade !== null && (
                                <span className="block mt-2 font-medium text-indigo-600 text-lg">
                                    Score: {submissionData.grade?.toFixed(1)}%
                                </span>
                            )}
                        </p>
                        <Link href="/student/dashboard" className="btn-primary w-full flex justify-center items-center gap-2">
                            <ArrowLeft size={18} /> Return to Dashboard
                        </Link>
                    </div>
                ) : (
                    <div className="w-full max-w-5xl h-full max-h-[calc(100vh-4rem)] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">

                        {/* PDF Panel - Only show if NO interactive questions */}
                        {hasPdf && !hasQuestions && (
                            <div className="bg-slate-100 border-r border-slate-200 relative w-full h-full">
                                <iframe src={`${exam.file_url}#toolbar=0`} className="w-full h-full bg-white" title="Exam PDF" />
                            </div>
                        )}

                        {/* Questions / Interaction Panel */}
                        {(!hasPdf || hasQuestions) && (
                            <div className="flex flex-col h-full overflow-hidden w-full max-w-3xl mx-auto">

                                {hasQuestions ? (
                                    <form onSubmit={handleSubmit} className="flex flex-col h-full">

                                        {/* Progress Bar (Slim) */}
                                        <div className="w-full bg-slate-50 h-1 shrink-0">
                                            <div
                                                className="bg-indigo-600 h-full transition-all duration-300 ease-out"
                                                style={{ width: `${((currentQuestionIndex + 1) / exam.questions.length) * 100}%` }}
                                            />
                                        </div>

                                        {/* Scrollable Question Content */}
                                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                    Question {currentQuestionIndex + 1} of {exam.questions.length}
                                                </span>
                                            </div>

                                            <h3 className="text-xl font-medium text-slate-900 leading-relaxed">
                                                {currentQuestion.text || currentQuestion.question}
                                            </h3>

                                            <div className="space-y-2">
                                                {currentQuestion.options?.map((opt: string, idx: number) => (
                                                    <label
                                                        key={idx}
                                                        className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all hover:bg-slate-50 ${mcqAnswers[currentQuestionIndex] === opt
                                                            ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500'
                                                            : 'bg-white border-slate-200'
                                                            }`}
                                                    >
                                                        <div className={`mt-0.5 w-5 h-5 rounded-full border mr-3 flex items-center justify-center shrink-0 transition-colors ${mcqAnswers[currentQuestionIndex] === opt
                                                            ? 'border-indigo-600 bg-indigo-600'
                                                            : 'border-slate-300'
                                                            }`}>
                                                            {mcqAnswers[currentQuestionIndex] === opt && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                        </div>
                                                        <input
                                                            type="radio"
                                                            name={`question-${currentQuestionIndex}`}
                                                            value={opt}
                                                            checked={mcqAnswers[currentQuestionIndex] === opt}
                                                            onChange={() => handleOptionSelect(currentQuestionIndex, opt)}
                                                            className="hidden"
                                                        />
                                                        <span className={`text-sm ${mcqAnswers[currentQuestionIndex] === opt ? 'text-indigo-900 font-medium' : 'text-slate-700'}`}>
                                                            {opt}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Footer Actions (Sticky bottom of card) */}
                                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center gap-4 shrink-0">
                                            <button
                                                type="button"
                                                onClick={handlePrev}
                                                disabled={currentQuestionIndex === 0}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentQuestionIndex === 0
                                                    ? 'text-slate-300 cursor-not-allowed'
                                                    : 'text-slate-600 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm'
                                                    }`}
                                            >
                                                Back
                                            </button>

                                            {currentQuestionIndex === exam.questions.length - 1 ? (
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="btn-primary py-2 px-6 text-sm shadow-md shadow-indigo-200"
                                                >
                                                    {loading ? '...' : 'Submit Exam'}
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleNext}
                                                    className="btn-primary py-2 px-6 text-sm shadow-md shadow-indigo-200"
                                                >
                                                    Next
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                ) : (
                                    // Text Answer Layout - also full height
                                    <div className="flex flex-col h-full p-6 md:p-8">
                                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <Send size={18} className="text-indigo-600" /> Your Answer
                                        </h3>
                                        <textarea
                                            className="flex-1 w-full p-4 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 font-mono text-sm leading-relaxed mb-4"
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
                        )}
                    </div>
                )}
            </div>
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
