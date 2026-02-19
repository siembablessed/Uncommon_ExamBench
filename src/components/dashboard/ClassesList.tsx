import Link from 'next/link'
import { Users, ChevronRight, Plus, ArrowUpRight } from 'lucide-react'
import { ClassItem } from '@/types'

interface ClassesListProps {
    classes: ClassItem[]
    onCreateClass: () => void
}

export default function ClassesList({ classes, onCreateClass }: ClassesListProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Users size={18} />
                    </div>
                    Your Classes
                </h2>
                <button
                    onClick={onCreateClass}
                    className="flex items-center gap-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm hover:shadow active:scale-95"
                >
                    <Plus size={14} />
                    Create
                </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                {classes.length === 0 ? (
                    <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
                            <Users size={24} />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900">No classes yet</h3>
                        <p className="text-xs text-slate-500 mt-1">Create your first class to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {classes.map((cls) => (
                            <Link key={cls.id} href={`/instructor/classes/${cls.id}`} className="block group relative overflow-hidden bg-white rounded-xl border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all duration-300">
                                <div className="p-4 relative z-10 flex justify-between items-center group-hover:translate-x-1 transition-transform">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                            {cls.name.substring(0, 2)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">{cls.name}</h3>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                                                ID: {cls.id.slice(0, 8)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-slate-300 group-hover:text-indigo-600 transition-colors">
                                        <ArrowUpRight size={18} />
                                    </div>
                                </div>
                                {/* Decorative Background Icon */}
                                <div className="absolute -bottom-2 -right-2 text-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform rotate-12 scale-110">
                                    <Users size={40} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
