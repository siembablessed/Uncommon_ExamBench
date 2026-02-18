'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { User as UserIcon, MapPin, ChevronUp, ChevronDown, Activity } from 'lucide-react'

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
    const [isExpanded, setIsExpanded] = useState(false)
    const [isInstructor, setIsInstructor] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const setupPresence = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setCurrentUser(user)

            // simple role check from metadata
            const role = user.user_metadata?.role
            if (role === 'instructor') {
                setIsInstructor(true)
            } else {
                return // Don't even connect if not instructor
            }

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

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsExpanded(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [containerRef])

    if (!isInstructor) return null

    // Filter out duplicates if any
    const uniqueUsers = Array.from(new Map(onlineUsers.map(u => [u.user_id, u])).values())

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end" ref={containerRef}>
            {/* Expanded List */}
            {isExpanded && (
                <div className="mb-4 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            Active Users
                        </h3>
                        <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">{uniqueUsers.length} Online</span>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
                        {uniqueUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                                <UserIcon size={24} className="opacity-20 mb-2" />
                                <p className="text-sm">No other users online.</p>
                            </div>
                        ) : (
                            uniqueUsers.map((u) => (
                                <div key={u.user_id} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-colors group">
                                    <div className={`relative w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm ${u.role === 'instructor' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-emerald-400 to-teal-500'
                                        }`}>
                                        {u.email[0].toUpperCase()}
                                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white rounded-full ${u.online_at ? 'bg-emerald-500' : 'bg-slate-300'
                                            }`}></span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-medium text-slate-900 truncate">
                                                {u.email.split('@')[0]}
                                                {u.user_id === currentUser?.id && <span className="text-slate-400 font-normal ml-1">(You)</span>}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
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
            )}

            {/* Minified Pill */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border transition-all duration-300 hover:scale-105 active:scale-95 ${isExpanded
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:shadow-indigo-100'
                    }`}
            >
                <div className="relative flex items-center justify-center">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </div>
                <span className="font-semibold text-sm">Live Activity</span>
                <span className={`flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-bold rounded-full ${isExpanded ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-600'
                    }`}>
                    {uniqueUsers.length}
                </span>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
        </div>
    )
}
