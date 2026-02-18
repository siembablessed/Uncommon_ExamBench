import Link from 'next/link'
import { Users, ChevronRight, Plus } from 'lucide-react'
import { ClassItem } from '@/types'

interface ClassesListProps {
    classes: ClassItem[]
}

export default function ClassesList({ classes }: ClassesListProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Users size={18} />
                    </div>
                    Your Classes
                </h2>
                {/* Optional: Add 'View All' or 'Add' button here if needed in future */}
            </div>

            <div className="p-4 flex-1">
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
                            <Link key={cls.id} href={`/instructor/classes/${cls.id}`} className="block group">
                                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all duration-200 flex justify-between items-center group-hover:translate-x-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs uppercase shadow-sm">
                                            {cls.name.substring(0, 2)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 text-sm">{cls.name}</h3>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                ID: {cls.id.slice(0, 8)}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
