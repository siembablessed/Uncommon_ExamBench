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
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                Online Users ({uniqueUsers.length})
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {uniqueUsers.length === 0 ? (
                    <p className="text-slate-500 text-sm">No other users online.</p>
                ) : (
                    uniqueUsers.map((u) => (
                        <div key={u.user_id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-full">
                                <UserIcon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                    {u.email}
                                    {u.user_id === currentUser?.id && <span className="text-slate-400 ml-1">(You)</span>}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${u.role === 'instructor'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {u.role}
                                    </span>
                                    {u.hub && (
                                        <span className="text-[10px] flex items-center gap-0.5 border border-slate-200 px-1.5 py-0.5 rounded text-slate-500">
                                            <MapPin size={10} /> {u.hub}
                                        </span>
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
