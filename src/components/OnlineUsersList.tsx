'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User as UserIcon, MapPin } from 'lucide-react'

interface PresenceState {
    [key: string]: {
        user_id: string
        online_at: string
        email?: string
        role?: string
        hub?: string
    }[]
}

interface OnlineUser {
    user_id: string
    email: string
    role: string
    hub?: string
    online_at: string
}

export default function OnlineUsersList() {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)

    useEffect(() => {
        const setupPresence = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setCurrentUser(user)

            const channel = supabase.channel('online-users', {
                config: {
                    presence: {
                        key: user.id,
                    },
                },
            })

            channel
                .on('presence', { event: 'sync' }, () => {
                    const newState = channel.presenceState<any>()
                    const users: OnlineUser[] = []

                    Object.values(newState).forEach(presences => {
                        presences.forEach(presence => {
                            users.push({
                                user_id: presence.user_id,
                                email: presence.email || 'Anonymous',
                                role: presence.role || 'unknown',
                                hub: presence.hub,
                                online_at: presence.online_at
                            })
                        })
                    })

                    setOnlineUsers(users)
                })
                .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                    // console.log('join', key, newPresences)
                })
                .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                    // console.log('leave', key, leftPresences)
                })
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await channel.track({
                            user_id: user.id,
                            email: user.email,
                            role: user.user_metadata?.role,
                            hub: user.user_metadata?.hub,
                            online_at: new Date().toISOString(),
                        })
                    }
                })

            return () => {
                supabase.removeChannel(channel)
            }
        }

        setupPresence()
    }, [])

    // Filter out duplicates if any (though key=user.id helps)
    const uniqueUsers = Array.from(new Map(onlineUsers.map(u => [u.user_id, u])).values())

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white to-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    Live Activity
                </h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{uniqueUsers.length} Online</span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[400px] p-2 custom-scrollbar">
                {uniqueUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                        <UserIcon size={32} className="opacity-20 mb-2" />
                        <p className="text-sm">No other users online.</p>
                    </div>
                ) : (
                    uniqueUsers.map((u) => (
                        <div key={u.user_id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors group">
                            <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${u.role === 'instructor' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-emerald-400 to-teal-500'
                                }`}>
                                {u.email[0].toUpperCase()}
                                <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${u.online_at ? 'bg-emerald-500' : 'bg-slate-300'
                                    }`}></span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm font-semibold text-slate-900 truncate">
                                        {u.email.split('@')[0]}
                                        {u.user_id === currentUser?.id && <span className="text-slate-400 font-normal ml-1">(You)</span>}
                                    </p>
                                    <span className="text-[10px] text-slate-400 group-hover:text-slate-500" suppressHydrationWarning>{new Date(u.online_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[10px] uppercase tracking-wider font-bold ${u.role === 'instructor'
                                        ? 'text-purple-600'
                                        : 'text-emerald-600'
                                        }`}>
                                        {u.role}
                                    </span>
                                    {u.hub && (
                                        <>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-[10px] flex items-center gap-0.5 text-slate-500">
                                                <MapPin size={10} /> {u.hub}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
