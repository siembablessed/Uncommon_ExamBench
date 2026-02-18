import { CheckCircle, Clock, FileText, TrendingUp, AlertCircle } from 'lucide-react'

interface StudentStatsProps {
    avgGrade: number
    pending: number
    missed: number
    completed: number
}

export default function StudentStatsCards({ avgGrade, pending, missed, completed }: StudentStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" suppressHydrationWarning>
            {/* Average Grade */}
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group">
                <div className="relative z-10">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                        <TrendingUp size={24} />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{avgGrade}%</div>
                    <div className="text-sm font-medium text-slate-500">Average Grade</div>
                </div>
                <div className="absolute -bottom-4 -right-4 text-emerald-50 opacity-50 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                    <TrendingUp size={100} />
                </div>
            </div>

            {/* Pending Exams */}
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group">
                <div className="relative z-10">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                        <Clock size={24} />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{pending}</div>
                    <div className="text-sm font-medium text-slate-500">Pending Exams</div>
                </div>
                <div className="absolute -bottom-4 -right-4 text-indigo-50 opacity-50 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                    <Clock size={100} />
                </div>
            </div>

            {/* Missed Exams */}
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group">
                <div className="relative z-10">
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl w-fit mb-4 group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                        <AlertCircle size={24} />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{missed}</div>
                    <div className="text-sm font-medium text-slate-500">Missed Exams</div>
                </div>
                <div className="absolute -bottom-4 -right-4 text-red-50 opacity-50 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                    <AlertCircle size={100} />
                </div>
            </div>

            {/* Completed Exams */}
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group">
                <div className="relative z-10">
                    <div className="p-3 bg-slate-50 text-slate-600 rounded-xl w-fit mb-4 group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300">
                        <CheckCircle size={24} />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{completed}</div>
                    <div className="text-sm font-medium text-slate-500">Completed Exams</div>
                </div>
                <div className="absolute -bottom-4 -right-4 text-slate-100 opacity-50 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                    <CheckCircle size={100} />
                </div>
            </div>
        </div>
    )
}
