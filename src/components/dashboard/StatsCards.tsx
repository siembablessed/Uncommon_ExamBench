import { Users, FileText, TrendingUp, ArrowUpRight } from 'lucide-react'

interface StatsCardsProps {
    classCount: number
    examCount: number
    recentSubmissionCount: number
}

export default function StatsCards({ classCount, examCount, recentSubmissionCount }: StatsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" suppressHydrationWarning>
            {/* Active Classes Card */}
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group">
                <div className="relative z-10">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                        <Users size={24} />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{classCount}</div>
                    <div className="text-sm font-medium text-slate-500 flex items-center gap-1">
                        Active Classes <ArrowUpRight size={14} className="text-indigo-500" />
                    </div>
                </div>
                {/* Decorative Background Icon */}
                <div className="absolute -bottom-4 -right-4 text-indigo-50 opacity-50 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                    <Users size={120} />
                </div>
            </div>

            {/* Total Exams Card */}
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group">
                <div className="relative z-10">
                    <div className="p-3 bg-violet-50 text-violet-600 rounded-xl w-fit mb-4 group-hover:bg-violet-600 group-hover:text-white transition-colors duration-300">
                        <FileText size={24} />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{examCount}</div>
                    <div className="text-sm font-medium text-slate-500 flex items-center gap-1">
                        Total Exams <ArrowUpRight size={14} className="text-violet-500" />
                    </div>
                </div>
                {/* Decorative Background Icon */}
                <div className="absolute -bottom-4 -right-4 text-violet-50 opacity-50 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                    <FileText size={120} />
                </div>
            </div>

            {/* Recent Submissions Card */}
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group">
                <div className="relative z-10">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                        <TrendingUp size={24} />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{recentSubmissionCount}</div>
                    <div className="text-sm font-medium text-slate-500 flex items-center gap-1">
                        Recent Submissions (24h) <ArrowUpRight size={14} className="text-emerald-500" />
                    </div>
                </div>
                {/* Decorative Background Icon */}
                <div className="absolute -bottom-4 -right-4 text-emerald-50 opacity-50 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                    <TrendingUp size={120} />
                </div>
            </div>
        </div>
    )
}
