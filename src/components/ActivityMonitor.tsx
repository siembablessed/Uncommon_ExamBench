'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, Clock, AlertTriangle } from 'lucide-react'

// Configuration
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000 // 15 Minutes
const WARNING_DURATION_MS = 60 * 1000 // 60 Seconds
const WARNING_TRIGGER_MS = INACTIVITY_LIMIT_MS - WARNING_DURATION_MS

export default function ActivityMonitor() {
    const supabase = createClient()
    const [lastActivity, setLastActivity] = useState(Date.now())
    const [showWarning, setShowWarning] = useState(false)
    const [timeLeft, setTimeLeft] = useState(WARNING_DURATION_MS / 1000)
    const [isActiveSession, setIsActiveSession] = useState(false)

    const router = useRouter()
    const pathname = usePathname()
    const warningIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Only monitor on dashboard pages or protected routes
    const isProtectedRoute = pathname?.startsWith('/instructor') || pathname?.startsWith('/student')

    // Check if we have a session to monitor
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setIsActiveSession(!!session)
        }
        checkSession()
    }, [pathname])

    const handleActivity = useCallback(() => {
        // If we're already showing the warning, user activity should dismiss it
        if (showWarning) {
            setShowWarning(false)
            if (warningIntervalRef.current) {
                clearInterval(warningIntervalRef.current)
                warningIntervalRef.current = null
            }
        }
        setLastActivity(Date.now())
    }, [showWarning])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login?message=Session expired due to inactivity')
        setShowWarning(false)
        setIsActiveSession(false)
    }

    // Setup Activity Listeners
    useEffect(() => {
        if (!isProtectedRoute || !isActiveSession) return

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart']

        // Throttle activity updates to avoid excessive state changes
        let throttleTimer: NodeJS.Timeout | null = null
        const throttledHandler = () => {
            if (!throttleTimer) {
                handleActivity()
                throttleTimer = setTimeout(() => { throttleTimer = null }, 1000)
            }
        }

        // Add listeners
        events.forEach(event => window.addEventListener(event, throttledHandler))

        // Cleanup
        return () => {
            events.forEach(event => window.removeEventListener(event, throttledHandler))
            if (throttleTimer) clearTimeout(throttleTimer)
        }
    }, [handleActivity, isProtectedRoute, isActiveSession])

    // Check Inactivity Loop
    useEffect(() => {
        if (!isProtectedRoute || !isActiveSession) return

        const checkInterval = setInterval(() => {
            const now = Date.now()
            const timeSinceActivity = now - lastActivity

            // Trigger Warning
            if (timeSinceActivity >= WARNING_TRIGGER_MS && !showWarning) {
                setShowWarning(true)
            }

            // Force Logout (Safety net if warning timer fails or tab was backgrounded)
            if (timeSinceActivity >= INACTIVITY_LIMIT_MS) {
                handleLogout()
            }
        }, 1000)

        return () => clearInterval(checkInterval)
    }, [lastActivity, showWarning, isProtectedRoute, isActiveSession])

    // Countdown Logic when Warning is shown
    useEffect(() => {
        if (showWarning) {
            setTimeLeft(WARNING_DURATION_MS / 1000)

            warningIntervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleLogout()
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        } else {
            if (warningIntervalRef.current) {
                clearInterval(warningIntervalRef.current)
            }
        }

        return () => {
            if (warningIntervalRef.current) clearInterval(warningIntervalRef.current)
        }
    }, [showWarning])

    if (!showWarning) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 border-l-4 border-amber-500">
                <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
                        <Clock size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Session Expiring</h3>
                        <p className="text-slate-500 text-sm mt-1">
                            You have been inactive for a while. You will be logged out in:
                        </p>
                    </div>
                </div>

                <div className="text-center py-4">
                    <span className={`text-4xl font-mono font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-slate-900'}`}>
                        {timeLeft}s
                    </span>
                </div>

                <div className="flex flex-col gap-3 mt-2">
                    <button
                        onClick={() => handleActivity()} // Dismiss warning
                        className="btn-primary w-full py-2.5"
                    >
                        I'm still here
                    </button>
                    <button
                        onClick={handleLogout}
                        className="text-slate-500 hover:text-slate-700 text-sm font-medium py-2"
                    >
                        Log out now
                    </button>
                </div>
            </div>
        </div>
    )
}
