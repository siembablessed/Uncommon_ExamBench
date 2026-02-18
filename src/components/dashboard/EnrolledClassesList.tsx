import { BookOpen, MapPin } from 'lucide-react'

interface EnrolledClassesProps {
    classes: {
        id: string
        name: string
    }[]
}

export default function EnrolledClassesList({ classes }: EnrolledClassesProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white to-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="text-indigo-600" size={20} />
                    My Classes
                </h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{classes.length} Enrolled</span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[300px] p-2 custom-scrollbar">
                {classes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                        <BookOpen size={32} className="opacity-20 mb-2" />
                        <p className="text-sm">Not enrolled in any classes.</p>
                        <p className="text-xs mt-1">Ask your instructor for a code.</p>
                    </div>
                ) : (
                    classes.map((cls) => (
                        <div key={cls.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors group">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <span className="font-bold text-sm">{cls.name[0].toUpperCase()}</span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                                    {cls.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                        Student
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
