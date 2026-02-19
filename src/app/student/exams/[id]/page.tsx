'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Clock, CheckCircle, FileText, AlertCircle } from 'lucide-react'
import ExamTimer from '@/components/ExamTimer'
import confetti from 'canvas-confetti'

import { toast } from 'sonner' // Add import

export default function StudentExamPage() {
    const supabase = createClient()
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
                grade: null as number | null,
                status: 'submitted' as 'submitted' | 'graded' | 'late'
            }

            // Auto-grading logic for MCQ
            const hasMarkingScheme = exam.questions?.some((q: any) => q.correctAnswer)

            if (hasQuestions && hasMarkingScheme) {
                let correctCount = 0
                exam.questions.forEach((q: any, i: number) => {
                    if (q.correctAnswer && mcqAnswers[i] === q.correctAnswer) {
                        correctCount++
                    }
                })
                const percentage = (correctCount / exam.questions.length) * 100
                submission.grade = parseFloat(percentage.toFixed(1))
                submission.status = 'graded' // Mark as graded if auto-graded
            } else {
                submission.grade = null // Awaiting manual marking
                submission.status = 'submitted'
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
                // Unique violation: Already submitted
                setSubmitted(true)
                toast.success('You have already submitted this exam.')
            } else if (error.code === '23503') {
                // Foreign key violation: Exam or Student does not exist
                if (error.message.includes('submissions_exam_id_fkey')) {
                    toast.error('Submission failed: This exam no longer exists. It may have been deleted by the instructor.')
                } else {
                    toast.error('Submission failed: Invalid user profile. Please try logging out and back in.')
                }
            } else {
                console.error('Submission error:', error)
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
        <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden relative font-sans" suppressHydrationWarning>

            {/* Floating Controls */}
            {!submitted && (
                <>
                    {/* Top Left: Exit & Title */}
                    <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
                        <button
                            onClick={handleExit}
                            className="bg-white/80 backdrop-blur-md shadow-sm border border-slate-200/60 text-slate-500 hover:text-slate-800 hover:bg-white p-2.5 rounded-xl transition-all group"
                            title="Exit Exam"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="bg-white/80 backdrop-blur-md shadow-sm border border-slate-200/60 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 max-w-[240px] truncate hidden sm:block tracking-wide">
                            {exam.title}
                        </div>
                    </div>

                    {/* Top Right: Timer */}
                    {duration && (
                        <div className="absolute top-4 right-4 z-50">
                            <div className={`bg-white/80 backdrop-blur-md shadow-sm border px-4 py-2 rounded-xl flex items-center gap-2.5 font-mono font-bold text-sm transition-colors ${
                                // You could add logic here to turn red when time is low if you exposed time remaining
                                'border-slate-200/60 text-slate-700'
                                }`}>
                                <Clock size={18} className="text-indigo-500" />
                                <ExamTimer durationMinutes={duration} onTimeUp={handleTimeUp} />
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Main Content Area */}
            <div className="flex-1 w-full h-full p-4 md:p-8 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">

                {submitted ? (
                    <div className="bg-white p-10 rounded-3xl shadow-2xl border border-white/50 max-w-lg w-full text-center animate-in zoom-in duration-300">
                        <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <CheckCircle size={48} className="text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-3">Exam Submitted!</h2>
                        <p className="text-slate-500 mb-10 text-lg leading-relaxed">
                            Your exam has been recorded securely.
                            {submissionData?.grade !== null && (
                                <span className="block mt-4 font-semibold text-indigo-600 text-xl bg-indigo-50 py-2 px-4 rounded-lg inline-block">
                                    Score: {submissionData.grade?.toFixed(1)}%
                                </span>
                            )}
                        </p>
                        <Link href="/student/dashboard" className="btn-primary w-full flex justify-center items-center gap-2 py-3.5 text-base rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all">
                            <ArrowLeft size={20} /> Return to Dashboard
                        </Link>
                    </div>
                ) : (
                    <div className="w-full max-w-4xl h-full max-h-[85vh] bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col md:flex-row relative">

                        {/* PDF Panel - Only show if NO interactive questions */}
                        {hasPdf && !hasQuestions && (
                            <div className="bg-slate-100 border-r border-slate-200 relative w-full h-full">
                                <iframe src={`${exam.file_url}#toolbar=0`} className="w-full h-full bg-white" title="Exam PDF" />
                            </div>
                        )}

                        {/* Questions / Interaction Panel */}
                        {(!hasPdf || hasQuestions) && (
                            <div className="flex flex-col h-full overflow-hidden w-full mx-auto">

                                {hasQuestions ? (
                                    <form onSubmit={handleSubmit} className="flex flex-col h-full">

                                        {/* Header inside Card */}
                                        <div className="pt-8 px-8 pb-4 bg-white z-10">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                    Question {currentQuestionIndex + 1} of {exam.questions.length}
                                                </span>
                                                <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">
                                                    {Math.round(((currentQuestionIndex + 1) / exam.questions.length) * 100)}% Completed
                                                </span>
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-indigo-500 h-full rounded-full transition-all duration-500 ease-out"
                                                    style={{ width: `${((currentQuestionIndex + 1) / exam.questions.length) * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Scrollable Question Content */}
                                        <div className="flex-1 overflow-y-auto px-8 py-2 hover:scroll-thumb-slate-300 scroll-smooth">
                                            <div className="py-2">
                                                <h3 className="text-2xl font-semibold text-slate-800 leading-snug mb-8">
                                                    {currentQuestion.text || currentQuestion.question}
                                                </h3>

                                                <div className="space-y-3">
                                                    {currentQuestion.options?.map((opt: string, idx: number) => (
                                                        <label
                                                            key={idx}
                                                            className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ease-in-out group ${mcqAnswers[currentQuestionIndex] === opt
                                                                ? 'bg-indigo-50/60 border-indigo-500 shadow-sm'
                                                                : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            <div className={`mt-0.5 w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center shrink-0 transition-colors duration-200 ${mcqAnswers[currentQuestionIndex] === opt
                                                                ? 'border-indigo-600 bg-indigo-600'
                                                                : 'border-slate-300 group-hover:border-indigo-400'
                                                                }`}>
                                                                {mcqAnswers[currentQuestionIndex] === opt && <div className="w-2 h-2 bg-white rounded-full scale-100 transition-transform" />}
                                                            </div>
                                                            <input
                                                                type="radio"
                                                                name={`question-${currentQuestionIndex}`}
                                                                value={opt}
                                                                checked={mcqAnswers[currentQuestionIndex] === opt}
                                                                onChange={() => handleOptionSelect(currentQuestionIndex, opt)}
                                                                className="hidden"
                                                            />
                                                            <span className={`text-base ${mcqAnswers[currentQuestionIndex] === opt ? 'text-indigo-900 font-medium' : 'text-slate-600'}`}>
                                                                {opt}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center gap-4 shrink-0 z-10">
                                            <button
                                                type="button"
                                                onClick={handlePrev}
                                                disabled={currentQuestionIndex === 0}
                                                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${currentQuestionIndex === 0
                                                    ? 'text-slate-300 cursor-not-allowed bg-slate-50'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                Previous
                                            </button>

                                            {currentQuestionIndex === exam.questions.length - 1 ? (
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/50 py-3 px-8 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0"
                                                >
                                                    {loading ? 'Submitting...' : 'Complete Exam'}
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleNext}
                                                    className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200 hover:shadow-slate-300 py-3 px-8 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0"
                                                >
                                                    Next Question
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                ) : (
                                    // Text Answer Layout
                                    <div className="flex flex-col h-full p-8">
                                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-3 text-lg">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                <Send size={18} />
                                            </div>
                                            Write your response
                                        </h3>
                                        <textarea
                                            className="flex-1 w-full p-6 border border-slate-200 rounded-2xl resize-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-700 font-mono text-sm leading-relaxed mb-6 bg-slate-50 focus:bg-white transition-all"
                                            placeholder="Type your structured answer here..."
                                            value={answerText}
                                            onChange={e => setAnswerText(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={loading || !answerText.trim()}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/50 py-4 rounded-xl text-base font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0"
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
        <a href={href} target="_blank" className="text-indigo-600 hover:text-indigo-800 transition-colors">
            <FileText size={16} />
        </a>
    )
}
