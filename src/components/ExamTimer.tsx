'use client'

import { useEffect, useState } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

interface ExamTimerProps {
    durationMinutes: number
    onTimeUp: () => void
}

export default function ExamTimer({ durationMinutes, onTimeUp }: ExamTimerProps) {
    const [timeLeft, setTimeLeft] = useState(durationMinutes * 60)
    const [isLowTime, setIsLowTime] = useState(false)

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeUp()
            return
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1)
        }, 1000)

        return () => clearInterval(timer)
    }, [timeLeft, onTimeUp])

    useEffect(() => {
        // Warn when 10% or 5 minutes remain
        if (timeLeft < Math.min(300, durationMinutes * 60 * 0.1)) {
            setIsLowTime(true)
        }
    }, [timeLeft, durationMinutes])

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
    }

    return (
        <div className={`flex items-center gap-2 font-mono font-bold text-lg px-4 py-2 rounded-lg border ${isLowTime ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
            {isLowTime ? <AlertTriangle size={20} /> : <Clock size={20} />}
            <span>{formatTime(timeLeft)}</span>
        </div>
    )
}
