import Link from 'next/link'
import { FileText, Calendar, ArrowRight } from 'lucide-react'
import { ExamItem } from '@/types'

interface ExamsListProps {
    exams: ExamItem[]
}

export default function ExamsList({ exams }: ExamsListProps) {
    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText size={20} className="text-indigo-600" /> Recent Exams
                </h2>
                <Link
                    href="/instructor/exams/create"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                    + New Exam
                </Link>
            </div>
            <div className="grid gap-3">
                {exams.length === 0 ? (
                    <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500">No exams created yet.</p>
                        <Link href="/instructor/exams/create" className="text-indigo-600 font-medium text-sm mt-2 block hover:underline">Create your first exam</Link>
                    </div>
                ) : (
                    exams.map((exam) => (
                        <div key={exam.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-slate-900">{exam.title}</h3>
                                <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-1 rounded-full border border-amber-100">
                                    {new Date() > new Date(exam.due_date) ? 'Closed' : 'Active'}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(exam.due_date).toLocaleDateString()}</span>
                            </div>
                            <Link
                                href={`/instructor/exams/${exam.id}`}
                                className="flex items-center justify-between w-full text-sm font-medium text-indigo-600 hover:bg-indigo-50 p-2 rounded transition-colors"
                            >
                                View Submissions <ArrowRight size={16} />
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </section>
    )
}
