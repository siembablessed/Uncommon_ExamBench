import Link from 'next/link'
import { FileText, Calendar, ArrowRight, Trash2, Edit, Plus, ChevronLeft, ChevronRight, File, Clock } from 'lucide-react'
import { ExamItem, Assignment } from '@/types'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import ConfirmDialog from '@/components/ConfirmDialog'
import { toast } from 'sonner'
import { useEffect } from 'react'

interface TimelineListProps {
    exams: ExamItem[]
    assignments: Assignment[]
}

type TimelineItem = (ExamItem | Assignment) & { type: 'exam' | 'assignment' }

export default function TimelineList({ exams: initialExams, assignments: initialAssignments }: TimelineListProps) {
    const supabase = createClient()
    const router = useRouter()

    // Merge and Tag
    const [items, setItems] = useState<TimelineItem[]>([])

    useEffect(() => {
        const taggedExams = initialExams.map(e => ({ ...e, type: 'exam' as const }))
        const taggedAssignments = initialAssignments.map(a => ({ ...a, type: 'assignment' as const }))
        setItems([...taggedExams, ...taggedAssignments])
    }, [initialExams, initialAssignments])

    const [confirmOpen, setConfirmOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'exam' | 'assignment' } | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active')
    const [page, setPage] = useState(0)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const ITEMS_PER_PAGE = 2

    const handleDeleteClick = (id: string, type: 'exam' | 'assignment') => {
        setItemToDelete({ id, type })
        setConfirmOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return
        setIsDeleting(true)
        try {
            const table = itemToDelete.type === 'exam' ? 'exams' : 'assignments'
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', itemToDelete.id)

            if (error) throw error

            setItems(prev => prev.filter(item => item.id !== itemToDelete.id))
            toast.success(`${itemToDelete.type === 'exam' ? 'Exam' : 'Assignment'} deleted successfully`)
            router.refresh()
        } catch (error: any) {
            console.error(`Error deleting ${itemToDelete.type}:`, error)
            toast.error(`Failed to delete ${itemToDelete.type}: ` + error.message)
        } finally {
            setIsDeleting(false)
            setConfirmOpen(false)
            setItemToDelete(null)
        }
    }

    const filteredItems = items.filter(item => {
        const isClosed = new Date() > new Date(item.due_date)
        return activeTab === 'active' ? !isClosed : isClosed
    }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
    const paginatedItems = filteredItems.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE)

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
                            <Clock size={18} />
                        </div>
                        Timeline
                    </h2>

                    {/* Pagination Controls */}
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

                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${isDropdownOpen ? 'bg-indigo-100 text-indigo-700' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}
                        >
                            <Plus size={16} /> New
                        </button>

                        {/* Overlay to close dropdown when clicking outside */}
                        {isDropdownOpen && (
                            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                        )}

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 p-1 z-20 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                <Link
                                    href="/instructor/exams/create"
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                                        <FileText size={16} />
                                    </div>
                                    <div>
                                        <span className="font-medium block">New Exam</span>
                                        <span className="text-[10px] text-slate-400">Quiz or assessment</span>
                                    </div>
                                </Link>
                                <Link
                                    href="/instructor/assignments/create"
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
                                        <File size={16} />
                                    </div>
                                    <div>
                                        <span className="font-medium block">New Assignment</span>
                                        <span className="text-[10px] text-slate-400">Homework submission</span>
                                    </div>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <div className="mx-auto w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
                            <Clock size={20} />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900">No {activeTab} items</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            {activeTab === 'active'
                                ? "You don't have any active exams or assignments."
                                : "No past items found."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {paginatedItems.map((item) => (
                            <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-violet-100 hover:shadow-md transition-all duration-200 group relative">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {item.type === 'exam' ? (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide bg-indigo-50 text-indigo-600 border-indigo-100">Exam</span>
                                            ) : (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide bg-emerald-50 text-emerald-600 border-emerald-100">Assignment</span>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-slate-900 line-clamp-1 pr-8">{item.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${new Date() > new Date(item.due_date)
                                                ? 'bg-slate-100 text-slate-500 border-slate-200'
                                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                }`}>
                                                {new Date() > new Date(item.due_date) ? 'Closed' : 'Active'}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs text-slate-500">
                                                <Calendar size={12} /> {new Date(item.due_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Link
                                            href={`/instructor/${item.type}s/${item.id}/edit`}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit size={16} />
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteClick(item.id, item.type)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <Link
                                    href={`/instructor/${item.type}s/${item.id}`}
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
                title={`Delete ${itemToDelete?.type === 'assignment' ? 'Assignment' : 'Exam'}`}
                message={`Are you sure you want to delete this ${itemToDelete?.type}? All student submissions and grades associated with it will be permanently lost.`}
                confirmText={isDeleting ? "Deleting..." : "Delete"}
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    )
}
