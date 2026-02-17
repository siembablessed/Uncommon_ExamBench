'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { LogOut, Settings, User as UserIcon, ChevronDown, Bell, Check, X } from 'lucide-react'

interface Notification {
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    is_read: boolean
    link?: string
    created_at: string
}

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isNotifOpen, setIsNotifOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const dropdownRef = useRef<HTMLDivElement>(null)
    const notifRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    useEffect(() => {
        const fetchUserAndProfile = async () => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser()
                if (error || !user) {
                    setLoading(false)
                    return
                }

                setUser(user)

                if (user) {
                    // Fetch Profile
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('avatar_url')
                        .eq('id', user.id)
                        .single()

                    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)

                    // Fetch Notifications
                    fetchNotifications(user.id)
                }
            } catch (error) {
                console.error('Error fetching user profile:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchUserAndProfile()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        // Click outside handler
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)

        // Listen for profile updates
        const handleProfileUpdate = () => {
            fetchUserAndProfile()
        }
        window.addEventListener('profile-updated', handleProfileUpdate)

        return () => {
            subscription.unsubscribe()
            document.removeEventListener('mousedown', handleClickOutside)
            window.removeEventListener('profile-updated', handleProfileUpdate)
        }
    }, [])

    useEffect(() => {
        if (!user) return

        // Real-time subscription for notifications
        const channel = supabase
            .channel('notifications-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    fetchNotifications(user.id)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user])

    const fetchNotifications = async (userId: string) => {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10)

        if (data) setNotifications(data)
    }

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
    }

    const markAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        if (!user) return
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false)
    }

    const unreadCount = notifications.filter(n => !n.is_read).length

    const handleSignOut = async () => {
        setIsDropdownOpen(false)
        await supabase.auth.signOut()
        router.push('/')
        router.refresh() // Ensure state clears
    }

    const userRole = user?.user_metadata?.role

    if (loading) return <div className="h-16 bg-white/80 border-b border-slate-200 animate-pulse" suppressHydrationWarning />

    const logoLink = user
        ? (userRole === 'instructor' ? '/instructor/dashboard' : '/student/dashboard')
        : '/'

    return (
        <nav className="glass-nav relative" suppressHydrationWarning>
            {/* African Print Border Top */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-mudcloth"></div>

            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <Link href={logoLink} className="text-xl font-bold text-bvunzo-secondary flex items-center gap-2">
                    <div
                        className="h-8 w-8 bg-bvunzo-primary rounded-lg flex items-center justify-center shadow-sm"
                        suppressHydrationWarning
                    >
                        <span className="text-white font-bold text-xl">B</span>
                    </div>
                    <span className="text-xl font-bold text-slate-800">
                        Bvunzo
                    </span>
                </Link>

                <div className="flex items-center gap-6">
                    {user ? (
                        <div className="flex items-center gap-4 md:gap-6">
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

                            {/* Notifications */}
                            <div className="relative" ref={notifRef}>
                                <button
                                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                                    className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors"
                                >
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                                    )}
                                </button>

                                {isNotifOpen && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 z-50 overflow-hidden">
                                        <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center">
                                            <h3 className="font-semibold text-sm text-slate-900">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-slate-400 text-sm">
                                                    No notifications yet
                                                </div>
                                            ) : (
                                                notifications.map(notif => (
                                                    <div
                                                        key={notif.id}
                                                        className={`px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 relative ${!notif.is_read ? 'bg-indigo-50/30' : ''}`}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notif.is_read ? 'bg-indigo-600' : 'bg-transparent'}`} />
                                                            <div className="flex-1 space-y-1">
                                                                <p className="text-sm font-medium text-slate-900 leading-none">{notif.title}</p>
                                                                <p className="text-xs text-slate-500 line-clamp-2">{notif.message}</p>
                                                                <p className="text-[10px] text-slate-400 mt-1">{new Date(notif.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                            {!notif.is_read && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                                                                    className="text-slate-400 hover:text-indigo-600 p-1 self-start"
                                                                    title="Mark as read"
                                                                >
                                                                    <Check size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        {notif.link && (
                                                            <Link href={notif.link} className="absolute inset-0" onClick={() => { setIsNotifOpen(false); markAsRead(notif.id); }} />
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

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
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
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
