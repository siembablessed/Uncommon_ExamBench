'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Bell, Check, ExternalLink, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Notification {
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    is_read: boolean
    link?: string
    created_at: string
}

export default function StudentNotifications() {
    const supabase = createClient()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        let channel: any;

        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            fetchNotifications()

            channel = supabase
                .channel('public:notifications')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                }, () => {
                    fetchNotifications()
                })
                .subscribe()
        }

        setupRealtime()

        return () => {
            if (channel) supabase.removeChannel(channel)
        }
    }, [])

    const fetchNotifications = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10)

            if (data) setNotifications(data)
        } catch (error) {
            console.error('Error fetching notifications:', error)
        } finally {
            setLoading(false)
        }
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
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
        if (unreadIds.length === 0) return

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds)
    }

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await markAsRead(notification.id)
        }
        if (notification.link) {
            router.push(notification.link)
        }
    }

    if (loading && notifications.length === 0) return null // Or skeleton

    if (notifications.length === 0) return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Bell size={20} className="text-slate-400" /> Notifications
            </h3>
            <p className="text-slate-500 text-sm italic">No new notifications</p>
        </div>
    )

    const unreadCount = notifications.filter(n => !n.is_read).length

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Bell size={18} className="text-indigo-600" />
                    Notifications
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                            {unreadCount}
                        </span>
                    )}
                </h3>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllRead}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                    >
                        Mark all read
                    </button>
                )}
            </div>

            <div className="max-h-[300px] overflow-y-auto">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer relative group ${!notification.is_read ? 'bg-indigo-50/30' : ''
                            }`}
                    >
                        {!notification.is_read && (
                            <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-500 rounded-full" />
                        )}

                        <div className="flex gap-3">
                            <div className={`mt-1 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                notification.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                    notification.type === 'error' ? 'bg-red-100 text-red-600' :
                                        'bg-blue-100 text-blue-600'
                                }`}>
                                {notification.type === 'success' ? <Check size={14} /> : <Bell size={14} />}
                            </div>
                            <div>
                                <h4 className={`text-sm font-semibold mb-0.5 ${!notification.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                                    {notification.title}
                                </h4>
                                <p className="text-xs text-slate-500 leading-relaxed mb-1.5 line-clamp-2">
                                    {notification.message}
                                </p>
                                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                    {new Date(notification.created_at).toLocaleDateString()} at {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
