'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Clock, CheckCircle, FileText } from 'lucide-react'

import ExamTimer from '@/components/ExamTimer'

export default function StudentExamPage() {
    const params = useParams()
    const examId = params.id as string
    const [exam, setExam] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    // Submission state
    const [answerText, setAnswerText] = useState('')
    const [submitted, setSubmitted] = useState(false)

    // Timer state
    const [duration, setDuration] = useState<number | null>(null)
    const [questionCount, setQuestionCount] = useState<number>(0)

    useEffect(() => {
        if (examId) fetchExam()
    }, [examId])

    const fetchExam = async () => {
        try {
            const { data } = await supabase.from('exams').select('*').eq('id', examId).single()
            if (data) {
                setExam(data)
                setDuration(data.duration_minutes)

                // Estimate question count from description if strictly formatted, or just default to 1 for basic logic
                // If it's AI generated JSON in description, parse it
                try {
                    // Look for JSON array in description? Or just simple heuristic
                    // For now, let's assume if it contains "Question X", we count matches
                    const matches = data.description.match(/Question \d+/g)
                    setQuestionCount(matches ? matches.length : 1)
                } catch (e) {
                    setQuestionCount(1)
                }
            }

            // Check if alreadySubmitted... (omitted for brevity in this chunk, assuming logic works)
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: sub } = await supabase.from('submissions').select('*').eq('exam_id', examId).eq('student_id', user.id).single()
                if (sub) setSubmitted(true)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleTimeUp = () => {
        if (!submitted) {
            alert('Time is up! Your exam is being submitted automatically.')
            handleSubmit(new Event('submit') as any, true)
        }
    }

    const handleSubmit = async (e: React.FormEvent, isAuto = false) => {
        if (e && e.preventDefault) e.preventDefault()
        // Allow text empty if auto-submitting (partial credit?)
        if (!answerText && !isAuto) return

        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return

            const { error } = await supabase.from('submissions').insert({
                exam_id: examId,
                student_id: user.id,
                content: answerText,
                status: 'submitted'
            })

            if (error) throw error

            setSubmitted(true)
            if (!isAuto) alert('Answer submitted!')

        } catch (error: any) {
            // Handle duplicate submission error gracefully
            if (error.code === '23505') {
                setSubmitted(true)
            } else {
                alert('Submission failed: ' + error.message)
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
                    The due date for <strong>{exam.title}</strong> has passed. <br />
                    You can no longer take or submit this exam.
                </p>
                <div className="text-sm text-slate-400 bg-slate-50 inline-block px-4 py-2 rounded">
                    Due: {new Date(exam.due_date).toLocaleString()}
                </div>
            </div>
        </div>
    )

    return (
        <div className="container mx-auto px-6 py-6 h-[calc(100vh-64px)] flex flex-col">
            <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 sticky top-0 z-10">
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

                    {duration && questionCount > 0 && !submitted && (
                        <div className="hidden md:block text-right">
                            <div className="text-xs text-slate-400 uppercase tracking-wider">Rec. Time / Question</div>
                            <div className="font-mono font-bold text-indigo-600">
                                {~~((duration * 60) / questionCount / 60)}m : {~~((duration * 60) / questionCount % 60)}s
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 grid md:grid-cols-2 gap-6 h-full min-h-0 pb-6">
                {/* PDF Viewer / Question Area */}
                <div className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-inner">
                    <div className="bg-white border-b border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 flex justify-between items-center">
                        <span>Question Paper</span>
                        {exam.file_url ? <ExternalLinkIcon href={exam.file_url} /> : null}
                    </div>
                    {exam.file_url ? (
                        <iframe src={exam.file_url} className="w-full flex-1 bg-white" title="Exam PDF" />
                    ) : (
                        <div className="bg-white p-6 flex-1 overflow-y-auto">
                            <p className="whitespace-pre-wrap text-slate-700 leading-relaxed font-serif text-lg">{exam.description}</p>
                            <p className="text-slate-400 italic mt-8 text-sm border-t pt-4">End of Questions</p>
                        </div>
                    )}
                </div>

                {/* Submission Area */}
                <div className="card flex flex-col h-full border-t-4 border-t-indigo-500">
                    <h2 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                        <Send size={20} className="text-indigo-600" /> Your Answer
                    </h2>

                    {submitted ? (
                        <div className="flex-1 flex items-center justify-center flex-col text-emerald-600 animate-in zoom-in duration-300">
                            <div className="bg-emerald-50 p-6 rounded-full mb-6">
                                <CheckCircle size={48} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Excellent Work!</h3>
                            <p className="text-slate-500 mb-8">Your exam has been submitted successfully.</p>
                            <Link href="/student/dashboard" className="btn-primary">Return to Dashboard</Link>
                        </div>
                    ) : (
                        <form onSubmit={(e) => handleSubmit(e)} className="flex-1 flex flex-col">
                            <div className="flex-1 mb-4 relative">
                                <textarea
                                    className="w-full h-full p-4 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-slate-700 leading-relaxed"
                                    placeholder="Type your answers here..."
                                    value={answerText}
                                    onChange={e => setAnswerText(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <span className="text-xs text-slate-500">
                                    Make sure to review before submitting.
                                </span>
                                <button
                                    type="submit"
                                    disabled={loading || !answerText.trim()}
                                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    <Send size={18} /> Submit Exam
                                </button>
                            </div>
                        </form>
                    )}
                </div>
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
