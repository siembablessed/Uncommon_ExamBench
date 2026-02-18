import { useState } from 'react'
import Link from 'next/link'
import { FileText, Clock, PlayCircle, CheckCircle, ArrowRight, AlertCircle, Calendar } from 'lucide-react'
import { ExamItem, SubmissionItem } from '@/types'

interface StudentExamsListProps {
    todoExams: ExamItem[]
    missedExams: ExamItem[]
    completedExams: ExamItem[]
    submissions: SubmissionItem[]
}

export default function StudentExamsList({ todoExams, missedExams, completedExams, submissions }: StudentExamsListProps) {
    const [activeTab, setActiveTab] = useState<'todo' | 'missed' | 'completed'>('todo')

    const getSubmission = (examId: string) => submissions.find(s => s.exam_id === examId)

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[500px]">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-100">
                <button
                    onClick={() => setActiveTab('todo')}
                    className={`flex-1 py-4 text-sm font-medium transition-all relative ${activeTab === 'todo' ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    To Do
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'todo' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {todoExams.length}
                    </span>
                    {activeTab === 'todo' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('missed')}
                    className={`flex-1 py-4 text-sm font-medium transition-all relative ${activeTab === 'missed' ? 'text-red-600 bg-red-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    Missed
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'missed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {missedExams.length}
                    </span>
                    {activeTab === 'missed' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500"></span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`flex-1 py-4 text-sm font-medium transition-all relative ${activeTab === 'completed' ? 'text-emerald-600 bg-emerald-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    Completed
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {completedExams.length}
                    </span>
                    {activeTab === 'completed' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500"></span>
                    )}
                </button>
            </div>

            {/* Content Area */}
            <div className="p-6 flex-1 overflow-y-auto">
                {activeTab === 'todo' && (
                    <div className="space-y-4">
                        {todoExams.length === 0 ? (
                            <EmptyState icon={<CheckCircle size={48} className="text-emerald-400 opacity-50 mb-4" />} message="You're all caught up! No pending exams." />
                        ) : (
                            todoExams.map(exam => (
                                <ExamCard key={exam.id} exam={exam} status="active" />
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'missed' && (
                    <div className="space-y-4">
                        {missedExams.length === 0 ? (
                            <EmptyState icon={<CheckCircle size={48} className="text-emerald-400 opacity-50 mb-4" />} message="Great job! No missed exams." />
                        ) : (
                            missedExams.map(exam => (
                                <ExamCard key={exam.id} exam={exam} status="missed" />
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'completed' && (
                    <div className="space-y-4">
                        {completedExams.length === 0 ? (
                            <EmptyState icon={<FileText size={48} className="text-slate-300 mb-4" />} message="You haven't completed any exams yet." />
                        ) : (
                            completedExams.map(exam => (
                                <ExamCard key={exam.id} exam={exam} status="completed" submission={getSubmission(exam.id)} />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function EmptyState({ icon, message }: { icon: React.ReactNode, message: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
            {icon}
            <h3 className="text-lg font-medium text-slate-900 mb-1">No Exams Found</h3>
            <p className="text-slate-500 max-w-xs mx-auto">{message}</p>
        </div>
    )
}

function ExamCard({ exam, status, submission }: { exam: ExamItem, status: 'active' | 'missed' | 'completed', submission?: SubmissionItem }) {
    return (
        <div className="group bg-white border border-slate-100 rounded-xl p-5 hover:shadow-md transition-all duration-300 hover:border-indigo-100 relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${status === 'missed' ? 'bg-red-500' : status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}></div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pl-2">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-700 transition-colors">
                        {exam.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                            <Calendar size={14} className="text-slate-400" />
                            {status === 'completed' && submission
                                ? `Submitted: ${new Date(submission.created_at).toLocaleDateString()}`
                                : `Due: ${new Date(exam.due_date).toLocaleDateString()}`
                            }
                        </span>
                        {status === 'active' && (
                            <span className="flex items-center gap-1.5 text-indigo-600 font-medium">
                                <Clock size={14} />
                                {new Date(exam.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                </div>

                {status === 'active' && (
                    <Link
                        href={`/student/exams/${exam.id}`}
                        className="btn-primary flex items-center gap-2 shadow-sm shadow-indigo-200"
                    >
                        Start Exam <PlayCircle size={16} />
                    </Link>
                )}

                {status === 'completed' && submission && (
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Grade</div>
                            <div className={`text-xl font-bold ${submission.grade !== null && submission.grade >= 80 ? 'text-emerald-600' :
                                    submission.grade !== null && submission.grade >= 50 ? 'text-indigo-600' : 'text-slate-600'
                                }`}>
                                {submission.grade !== null ? `${submission.grade}%` : 'Pending'}
                            </div>
                        </div>
                        {submission.grade !== null && (
                            <Link href={`/student/results/${submission.id}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                <ArrowRight size={20} />
                            </Link>
                        )}
                    </div>
                )}
                {status === 'missed' && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1">
                        <AlertCircle size={12} /> Missed
                    </span>
                )}
            </div>
        </div>
    )
}
