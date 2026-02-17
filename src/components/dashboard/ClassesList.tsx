import Link from 'next/link'
import { Users } from 'lucide-react'
import { ClassItem } from '@/types'

interface ClassesListProps {
    classes: ClassItem[]
}

export default function ClassesList({ classes }: ClassesListProps) {
    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Users size={20} className="text-indigo-600" /> Your Classes
                </h2>
            </div>
            <div className="grid gap-3">
                {classes.length === 0 ? (
                    <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500">No classes created yet.</p>
                    </div>
                ) : (
                    classes.map((cls) => (
                        <Link key={cls.id} href={`/instructor/classes/${cls.id}`} className="block group">
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-slate-900">{cls.name}</h3>
                                    <p className="text-xs text-slate-400 font-mono mt-1">{cls.id.slice(0, 8)}...</p>
                                </div>
                                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-medium group-hover:bg-indigo-600 group-hover:text-white transition-colors">Manage</span>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </section>
    )
}
