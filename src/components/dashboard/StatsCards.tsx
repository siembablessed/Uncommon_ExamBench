import { Users, FileText, TrendingUp } from 'lucide-react'

interface StatsCardsProps {
    classCount: number
    examCount: number
    recentSubmissionCount: number
}

export default function StatsCards({ classCount, examCount, recentSubmissionCount }: StatsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Users size={24} />
                </div>
                <div>
                    <div className="text-2xl font-bold text-slate-900">{classCount}</div>
                    <div className="text-sm text-slate-500">Active Classes</div>
                </div>
            </div>
            <div className="card flex items-center gap-4">
                <div className="p-3 bg-violet-50 text-violet-600 rounded-lg">
                    <FileText size={24} />
                </div>
                <div>
                    <div className="text-2xl font-bold text-slate-900">{examCount}</div>
                    <div className="text-sm text-slate-500">Total Exams</div>
                </div>
            </div>
            <div className="card flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                    <TrendingUp size={24} />
                </div>
                <div>
                    <div className="text-2xl font-bold text-slate-900">{recentSubmissionCount}</div>
                    <div className="text-sm text-slate-500">Recent Submissions (24h)</div>
                </div>
            </div>
        </div>
    )
}
