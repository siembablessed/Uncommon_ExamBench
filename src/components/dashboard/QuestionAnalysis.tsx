'use client'

import React, { useMemo } from 'react'
import { BarChart, CheckCircle, XCircle, AlertTriangle, TrendingUp, HelpCircle } from 'lucide-react'

interface Question {
    text: string
    question?: string // generic fallback
    options: string[]
    correctAnswer: string
}

interface Submission {
    id: string
    answers: Record<string, string> // key is question index
}

interface QuestionAnalysisProps {
    questions: Question[]
    submissions: Submission[]
}

export default function QuestionAnalysis({ questions, submissions }: QuestionAnalysisProps) {

    // Calculate Stats
    const stats = useMemo(() => {
        if (!questions || !submissions || submissions.length === 0) return null

        const questionStats = questions.map((q, index) => {
            let correct = 0
            let incorrect = 0
            let total = 0

            submissions.forEach(sub => {
                const answer = sub.answers?.[index]
                if (answer) {
                    total++
                    if (answer === q.correctAnswer) {
                        correct++
                    } else {
                        incorrect++
                    }
                }
            })

            return {
                index,
                question: q.text || q.question || `Question ${index + 1}`,
                correct,
                incorrect,
                total,
                passRate: total > 0 ? (correct / total) * 100 : 0
            }
        })

        // Find insights
        const sortedByFail = [...questionStats].sort((a, b) => a.passRate - b.passRate)
        const sortedByPass = [...questionStats].sort((a, b) => b.passRate - a.passRate)

        const mostFailed = sortedByFail[0]
        const highestPassed = sortedByPass[0]

        // Calculate average exam score (based on questions)
        const totalCorrect = questionStats.reduce((acc, curr) => acc + curr.correct, 0)
        const totalAnswers = questionStats.reduce((acc, curr) => acc + curr.total, 0)
        const overallPassRate = totalAnswers > 0 ? (totalCorrect / totalAnswers) * 100 : 0

        return {
            questionStats,
            mostFailed,
            highestPassed,
            overallPassRate
        }
    }, [questions, submissions])

    if (!questions || questions.length === 0) {
        return <div className="p-8 text-center text-slate-500">No questions found for this exam.</div>
    }

    if (!submissions || submissions.length === 0) {
        return (
            <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <BarChart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-900">No Data Yet</h3>
                <p className="text-slate-500">Waiting for students to submit exams to generate analysis.</p>
            </div>
        )
    }

    if (!stats) return null

    return (
        <div className="space-y-8 animate-in fade-in duration-300">

            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-6">

                {/* Most Failed */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertTriangle className="w-24 h-24 text-red-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-red-600 font-bold mb-2 uppercase tracking-wider text-xs">
                            <AlertTriangle size={14} /> Needs Attention
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">{100 - Math.round(stats.mostFailed.passRate)}%</h3>
                        <p className="text-sm font-medium text-slate-500 mb-4">fail rate on Question {stats.mostFailed.index + 1}</p>

                        <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                            <p className="text-sm text-slate-700 line-clamp-2 font-medium">
                                "{stats.mostFailed.question}"
                            </p>
                        </div>
                    </div>
                </div>

                {/* Highest Passed */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-24 h-24 text-emerald-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-emerald-600 font-bold mb-2 uppercase tracking-wider text-xs">
                            <TrendingUp size={14} /> Strongest Topic
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">{Math.round(stats.highestPassed.passRate)}%</h3>
                        <p className="text-sm font-medium text-slate-500 mb-4">pass rate on Question {stats.highestPassed.index + 1}</p>

                        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                            <p className="text-sm text-slate-700 line-clamp-2 font-medium">
                                "{stats.highestPassed.question}"
                            </p>
                        </div>
                    </div>
                </div>

                {/* Overall Performance */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle className="w-24 h-24 text-indigo-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold mb-2 uppercase tracking-wider text-xs">
                            <CheckCircle size={14} /> Average Score
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">{Math.round(stats.overallPassRate)}%</h3>
                        <p className="text-sm font-medium text-slate-500 mb-4">across all questions</p>

                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-6">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${stats.overallPassRate}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Stats List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <HelpCircle size={18} className="text-slate-400" />
                        Question Performance Breakdown
                    </h3>
                </div>
                <div className="divide-y divide-slate-50">
                    {stats.questionStats.map((stat, i) => (
                        <div key={i} className="p-6 hover:bg-slate-50 transition-colors">
                            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-slate-900 mb-1">{stat.question}</h4>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span>Total Attempts: {stat.total}</span>
                                        <span className="text-emerald-600 font-medium">{stat.correct} Correct</span>
                                        <span className="text-red-500 font-medium">{stat.incorrect} Incorrect</span>
                                        {/* Show correct answer on hover/expand? Keeping simple for now */}
                                    </div>
                                </div>
                                <div className="w-full md:w-48 flex items-center gap-3">
                                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                                        <div
                                            className="h-full bg-emerald-500"
                                            style={{ width: `${stat.passRate}%` }}
                                            title={`Passed: ${stat.passRate.toFixed(1)}%`}
                                        />
                                        <div
                                            className="h-full bg-red-400"
                                            style={{ width: `${100 - stat.passRate}%` }}
                                            title={`Failed: ${(100 - stat.passRate).toFixed(1)}%`}
                                        />
                                    </div>
                                    <span className={`text-sm font-bold w-12 text-right ${stat.passRate >= 70 ? 'text-emerald-600' : stat.passRate >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                                        {Math.round(stat.passRate)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    )
}
