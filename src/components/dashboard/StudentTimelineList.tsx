import Link from 'next/link'
import { FileText, Calendar, ArrowRight, CheckCircle, Clock, AlertCircle, File } from 'lucide-react'
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

    // Date formatter (24-hour clock)
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })
    }

    const renderItem = (item: ExamItem | Assignment, status: 'todo' | 'missed' | 'completed') => {
        const submission = getSubmission(item.id)
        const type = isAssignment(item) ? 'assignment' : 'exam'
        const link = `/student/${type}s/${item.id}`

        return (
            <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-violet-100 hover:shadow-md transition-all duration-200 group">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            {type === 'exam' ? (
                                <span className="bg-indigo-50 text-indigo-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                                    Exam
                                </span>
                            ) : (
                                <span className="bg-emerald-50 text-emerald-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                                    Assignment
                                </span>
                            )}
                            {status === 'missed' && (
                                <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-100 flex items-center gap-1">
                                    <AlertCircle size={10} /> Missed
                                </span>
                            )}
                            {status === 'completed' && submission?.grade !== null && (
                                <span className="bg-violet-50 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-violet-100">
                                    Graded: {submission.grade}/{type === 'assignment' ? (item as Assignment).points : ((item as ExamItem).questions?.length || 0) * 10}
                                </span>
                            )}
                        </div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {item.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                                <Calendar size={12} /> {formatDate(item.due_date)}
                            </span>
                            {type === 'assignment' && (
                                <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                    Late Penalty: -{(item as Assignment).late_penalty_amount}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                    <div className="text-xs font-medium text-slate-400">
                        {status === 'completed' ? (
                            <span className="flex items-center gap-1 text-emerald-600">
                                <CheckCircle size={12} /> Submitted
                            </span>
                        ) : (
                            <span>Due: {formatDate(item.due_date)}</span>
                        )}
                    </div>

                    <Link
                        href={link}
                        className={`text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${status === 'completed'
                                ? 'text-slate-500 bg-slate-100 hover:bg-slate-200'
                                : 'text-white bg-slate-900 hover:bg-slate-800 shadow-sm'
                            }`}
                    >
                        {status === 'completed' ? 'View Results' : 'Start Now'} <ArrowRight size={12} />
                    </Link>
                </div>
            </div>
        )
    }

    if (todoItems.length === 0 && missedItems.length === 0 && completedItems.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <FileText size={24} />
                </div>
                <h3 className="text-slate-900 font-semibold">All Caught Up!</h3>
                <p className="text-slate-500 text-sm mt-1">You have no pending exams or assignments.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* To Do Section */}
            {todoItems.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Clock size={18} />
                        </div>
                        Up Next
                        <span className="text-xs font-normal text-slate-500 ml-auto">{todoItems.length} pending</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {todoItems.map(item => renderItem(item, 'todo'))}
                    </div>
                </div>
            )}

            {/* Missed Section */}
            {missedItems.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-5 duration-500 delay-100">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                            <AlertCircle size={18} />
                        </div>
                        Missed
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {missedItems.map(item => renderItem(item, 'missed'))}
                    </div>
                </div>
            )}

            {/* Completed Section */}
            {completedItems.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 delay-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                            <CheckCircle size={18} />
                        </div>
                        Completed
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4 opacity-75 hover:opacity-100 transition-opacity">
                        {completedItems.map(item => renderItem(item, 'completed'))}
                    </div>
                </div>
            )}
        </div>
    )
}
