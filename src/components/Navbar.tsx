'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { LogOut, Settings, User as UserIcon, ChevronDown } from 'lucide-react'

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    useEffect(() => {
        const fetchUserAndProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('avatar_url')
                    .eq('id', user.id)
                    .single()

                if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)
            }
            setLoading(false)
        }

        fetchUserAndProfile()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            // Re-fetch profile on auth change could be added here
        })

        // Click outside handler
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            subscription.unsubscribe()
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const handleSignOut = async () => {
        setIsDropdownOpen(false)
        await supabase.auth.signOut()
        router.push('/')
        router.refresh() // Ensure state clears
    }

    const userRole = user?.user_metadata?.role

    if (loading) return <div className="h-16 bg-white/80 border-b border-slate-200 animate-pulse" suppressHydrationWarning />

    return (
        <nav className="glass-nav" suppressHydrationWarning>
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="text-xl font-bold text-indigo-600 flex items-center gap-2">
                    <div
                        className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center"
                        suppressHydrationWarning
                    >
                        <span className="text-white font-bold text-xl">E</span>
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        ExamNexus
                    </span>
                </Link>

                <div className="flex items-center gap-6">
                    {user ? (
                        <div className="flex items-center gap-6">
                            {/* Role-based Links */}
                            {userRole === 'instructor' ? (
                                <div className="hidden md:flex gap-6 text-sm font-medium">
                                    <Link href="/instructor/dashboard" className="text-slate-600 hover:text-indigo-600 transition-colors">Dashboard</Link>
                                    <Link href="/instructor/classes" className="text-slate-600 hover:text-indigo-600 transition-colors">Classes</Link>
                                </div>
                            ) : (
                                <div className="hidden md:flex gap-6 text-sm font-medium">
                                    <Link href="/student/dashboard" className="text-slate-600 hover:text-indigo-600 transition-colors">Dashboard</Link>
                                </div>
                            )}

                            {/* Profile Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded-full transition-colors border border-transparent hover:border-slate-200"
                                >
                                    <div className="h-9 w-9 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center border border-indigo-200">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-indigo-600 font-bold text-sm">
                                                {user.email?.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 z-50">
                                        <div className="px-4 py-3 border-b border-slate-50 mb-1">
                                            <p className="text-sm font-medium text-slate-900 truncate">
                                                {userRole === 'instructor' ? 'Instructor' : 'Student'}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                        </div>

                                        <Link
                                            href={userRole === 'student' ? "/student/settings" : "/instructor/dashboard"} // Instructors don't have settings page yet, fallback to dashboard
                                            className="flex items-center gap-2 px-4 py-2text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            <Settings size={16} />
                                            Settings
                                        </Link>

                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors mt-1"
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                                Login
                            </Link>
                            <Link href="/signup" className="btn-primary text-sm">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}
