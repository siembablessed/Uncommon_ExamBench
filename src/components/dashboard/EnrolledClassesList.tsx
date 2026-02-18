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
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <BookOpen className="text-indigo-600" size={18} />
                    My Classes
                </h3>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">{classes.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[150px] p-2 custom-scrollbar">
                {classes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                        <BookOpen size={28} className="opacity-20 mb-2" />
                        <p className="text-sm">No classes enrolled.</p>
                    </div>
                ) : (
                    <div className="grid gap-2">
                        {classes.map((cls) => (
                            <div key={cls.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors group cursor-default border border-transparent hover:border-slate-100">
                                <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all text-xs font-bold">
                                    {cls.name[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-semibold text-slate-700 truncate group-hover:text-indigo-700 transition-colors">
                                        {cls.name}
                                    </h4>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
