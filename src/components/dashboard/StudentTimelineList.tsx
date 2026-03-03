import Link from 'next/link'
import { FileText, Calendar, ArrowRight, CheckCircle, Clock, AlertCircle, TrendingUp, ChevronRight } from 'lucide-react'
import { ExamItem, Assignment, SubmissionItem } from '@/types'

interface StudentTimelineListProps {
    todoItems: (ExamItem | Assignment)[]
    missedItems: (ExamItem | Assignment)[]
    completedItems: (ExamItem | Assignment)[]
    submissions: SubmissionItem[]
}

export default function StudentTimelineList({ todoItems, missedItems, completedItems, submissions }: StudentTimelineListProps) {

    // Helper to get submission for an item
    const getSubmission = (id: string) => submissions.find(s => s.exam_id === id || s.assignment_id === id)

    // Helper to check if item is an assignment
    const isAssignment = (item: any): item is Assignment => 'points' in item

    // Date formatter
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // Sort Todo Items by due date (closest first)
    const sortedTodo = [...todoItems].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    const upNextItem = sortedTodo[0]
    const otherTodoItems = sortedTodo.slice(1)

    // Render Hero Card for Up Next
    const renderHeroItem = (item: ExamItem | Assignment) => {
        const type = isAssignment(item) ? 'assignment' : 'exam' // Corrected logic
        const link = `/student/${type}s/${item.id}`
        const dueDate = new Date(item.due_date)
        const isToday = new Date().toDateString() === dueDate.toDateString()
        const isTomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toDateString() === dueDate.toDateString()

        let dueText = formatDate(item.due_date)
        if (isToday) dueText = `Today, ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        if (isTomorrow) dueText = `Tomorrow, ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`

        return (
            <div key={item.id} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-200 p-6 md:p-8 mb-8 group transition-all hover:scale-[1.01]">
                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 p-24 bg-black/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-white/10 flex items-center gap-1.5">
                                <Clock size={12} /> Up Next
                            </span>
                            <span className="bg-white/10 backdrop-blur-md text-indigo-100 px-3 py-1 rounded-full text-xs font-semibold border border-white/10 uppercase">
                                {type}
                            </span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight group-hover:text-white/90 transition-colors">
                            {item.title}
                        </h3>
                        <div className="flex items-center gap-4 text-indigo-100 text-sm font-medium">
                            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                                <Calendar size={14} /> {dueText}
                            </span>
                            {type === 'assignment' && (
                                <span className="flex items-center gap-1.5 bg-amber-500/20 text-amber-200 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-amber-500/20">
                                    <AlertCircle size={14} /> Late Penalty: -{(item as Assignment).late_penalty_amount}pts
                                </span>
                            )}
                        </div>
                    </div>

                    <Link
                        href={link}
                        className="w-full md:w-auto bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-4 rounded-xl font-bold text-sm shadow-lg shadow-black/10 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 active:translate-y-0 active:scale-95"
                    >
                        Start Now <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        )
    }

    const renderEmptyState = () => (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <CheckCircle size={32} />
            </div>
            <h3 className="text-slate-900 font-bold text-lg mb-1">All Caught Up!</h3>
            <p className="text-slate-500 text-sm">You have no pending exams or assignments.</p>
        </div>
    )

    return (
        <div className="space-y-10">
            {/* 1. UP NEXT HERO SECTION */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Clock size={18} />
                        </div>
                        Priority Tasks
                    </h2>
                </div>

                {upNextItem ? renderHeroItem(upNextItem) : renderEmptyState()}

                {/* Other standard items */}
                {otherTodoItems.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-4 mt-6">
                        {otherTodoItems.map(item => {
                            const type = isAssignment(item) ? 'assignment' : 'exam'
                            const link = `/student/${type}s/${item.id}`
                            return (
                                <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border mb-2 inline-block ${type === 'exam' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                }`}>
                                                {type}
                                            </span>
                                            <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{item.title}</h4>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4 text-xs">
                                        <span className="text-slate-500 flex items-center gap-1">
                                            <Calendar size={12} /> {formatDate(item.due_date)}
                                        </span>
                                        <Link href={link} className="text-slate-900 font-medium hover:text-indigo-600 flex items-center gap-1">
                                            Start <ArrowRight size={12} />
                                        </Link>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>

            {/* 2. MISSED SECTION (Only show if exists) */}
            {missedItems.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                            <AlertCircle size={18} />
                        </div>
                        Missed Tasks
                        <span className="text-xs font-normal text-slate-500 ml-auto bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{missedItems.length}</span>
                    </h2>
                    <div className="space-y-3">
                        {missedItems.map(item => (
                            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-red-100 p-4 rounded-xl hover:shadow-sm transition-all group">
                                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                                        <AlertCircle size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900">{item.title}</h4>
                                        <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                                            Due {formatDate(item.due_date)}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href={`/student/${isAssignment(item) ? 'assignment' : 'exam'}s/${item.id}`} // Assuming missed items can still be viewed/attempted? 
                                    // If not, maybe just show "Missed" or contact instructor. For now, assuming standard link.
                                    className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors text-center"
                                >
                                    View Details
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 3. COMPLETED SECTION (Compact List) */}
            {completedItems.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                            <CheckCircle size={18} />
                        </div>
                        Completed History
                    </h2>
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                        {completedItems.map(item => {
                            const submission = getSubmission(item.id)
                            const grade = submission?.grade || 0
                            const maxScore = isAssignment(item) ? (item as Assignment).points : ((item as ExamItem).questions?.length || 0) * 10 || 100 // Fallback max score

                            // Normalize grade color
                            // If grade is percentage (0-100) or raw points? Assuming percentage from previous context or logic.
                            // The submission logic stored grade as percentage for Exams. 

                            let gradeColor = 'text-slate-600 bg-slate-100'
                            if (grade >= 80) gradeColor = 'text-emerald-700 bg-emerald-50 border-emerald-100'
                            else if (grade >= 50) gradeColor = 'text-amber-700 bg-amber-50 border-amber-100'
                            else if (grade > 0) gradeColor = 'text-red-700 bg-red-50 border-red-100'

                            return (
                                <div key={item.id} className="group p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${grade >= 50 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                                            {isAssignment(item) ? <FileText size={18} /> : <CheckCircle size={18} />}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                <span>Submitted on {submission?.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : '-'}</span>
                                                {isAssignment(item) && <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">Assignment</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${gradeColor}`}>
                                            {grade !== null ? `${grade}%` : 'Pending'}
                                        </div>
                                        <Link
                                            href={isAssignment(item) ? `/student/assignments/${item.id}` : `/student/results/${submission?.id}`}
                                            className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                                            title="View Results"
                                        >
                                            <ChevronRight size={20} />
                                        </Link>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}
        </div>
    )
}
