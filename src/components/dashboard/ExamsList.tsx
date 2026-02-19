import Link from 'next/link'
import { FileText, Calendar, ArrowRight, Trash2, Edit, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { ExamItem } from '@/types'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import ConfirmDialog from '@/components/ConfirmDialog'

interface ExamsListProps {
    exams: ExamItem[]
}

import { toast } from 'sonner'
import { useEffect } from 'react'

export default function ExamsList({ exams: initialExams }: ExamsListProps) {
    const supabase = createClient()
    const router = useRouter()
    const [exams, setExams] = useState(initialExams)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [examToDelete, setExamToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active')
    const [page, setPage] = useState(0)
    const ITEMS_PER_PAGE = 2

    // Sync state with props when server refetches (fixes "reappears on refresh" if caused by stale client state)
    useEffect(() => {
        setExams(initialExams)
    }, [initialExams])

    const handleDeleteClick = (id: string) => {
        setExamToDelete(id)
        setConfirmOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!examToDelete) return
        setIsDeleting(true)
        try {
            const { error } = await supabase
                .from('exams')
                .delete()
                .eq('id', examToDelete)

            if (error) throw error

            setExams(prev => prev.filter(e => e.id !== examToDelete))
            toast.success('Exam deleted successfully')
            router.refresh()
        } catch (error: any) {
            console.error('Error deleting exam:', error)
            toast.error('Failed to delete exam: ' + error.message)
        } finally {
            setIsDeleting(false)
            setConfirmOpen(false)
            setExamToDelete(null)
        }
    }

    const filteredExams = exams.filter(exam => {
        const isClosed = new Date() > new Date(exam.due_date)
        return activeTab === 'active' ? !isClosed : isClosed
    })

    const totalPages = Math.ceil(filteredExams.length / ITEMS_PER_PAGE)
    const paginatedExams = filteredExams.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE)

    const handleTabChange = (tab: 'active' | 'closed') => {
        setActiveTab(tab)
        setPage(0)
    }

    const handlePrevPage = () => {
        setPage(p => Math.max(0, p - 1))
    }

    const handleNextPage = () => {
        setPage(p => Math.min(totalPages - 1, p + 1))
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <div className="p-1.5 bg-violet-50 text-violet-600 rounded-lg">
                            <FileText size={18} />
                        </div>
                        Recent Exams
                    </h2>

                    {/* Pagination Controls (only show if needed) */}
                    {totalPages > 1 && (
                        <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                            <button
                                onClick={handlePrevPage}
                                disabled={page === 0}
                                className="p-1 hover:bg-white hover:shadow-sm rounded-md disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all text-slate-500"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="text-[10px] font-medium text-slate-400 px-1 select-none">
                                {page + 1}/{totalPages}
                            </span>
                            <button
                                onClick={handleNextPage}
                                disabled={page === totalPages - 1}
                                className="p-1 hover:bg-white hover:shadow-sm rounded-md disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all text-slate-500"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Tab Switcher */}
                    <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-medium">
                        <button
                            onClick={() => handleTabChange('active')}
                            className={`px-3 py-1 rounded-md transition-all ${activeTab === 'active'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => handleTabChange('closed')}
                            className={`px-3 py-1 rounded-md transition-all ${activeTab === 'closed'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Closed
                        </button>
                    </div>

                    <Link
                        href="/instructor/exams/create"
                        className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <Plus size={16} /> New
                    </Link>
                </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                {filteredExams.length === 0 ? (
                    <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <div className="mx-auto w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
                            <FileText size={20} />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900">No {activeTab} exams</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            {activeTab === 'active'
                                ? "You don't have any active exams right now."
                                : "No past exams found."}
                        </p>
                        {activeTab === 'active' && (
                            <Link href="/instructor/exams/create" className="text-indigo-600 font-medium text-xs mt-3 block hover:underline">Create Exam</Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {paginatedExams.map((exam) => (
                            <div key={exam.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-violet-100 hover:shadow-md transition-all duration-200 group relative">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-semibold text-slate-900 line-clamp-1 pr-8">{exam.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${new Date() > new Date(exam.due_date)
                                                ? 'bg-slate-100 text-slate-500 border-slate-200'
                                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                }`}>
                                                {new Date() > new Date(exam.due_date) ? 'Closed' : 'Active'}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs text-slate-500">
                                                <Calendar size={12} /> {new Date(exam.due_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Link
                                            href={`/instructor/exams/${exam.id}/edit`}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Edit Exam"
                                        >
                                            <Edit size={16} />
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteClick(exam.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Exam"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <Link
                                    href={`/instructor/exams/${exam.id}`}
                                    className="mt-3 flex items-center justify-between w-full text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 p-2 rounded-lg transition-colors"
                                >
                                    View Submissions <ArrowRight size={14} />
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={confirmOpen}
                title="Delete Exam"
                message="Are you sure you want to delete this exam? All student submissions and grades associated with it will be permanently lost."
                confirmText={isDeleting ? "Deleting..." : "Delete Exam"}
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    )
}
