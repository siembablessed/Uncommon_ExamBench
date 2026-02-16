'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user)
            setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const userRole = user?.user_metadata?.role

    if (loading) return <div className="h-16 bg-white border-b" />

    return (
        <nav className="border-b bg-white">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="text-xl font-bold">
                    ExamNexus
                </Link>

                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            {userRole === 'instructor' ? (
                                <div className="flex gap-4">
                                    <Link href="/instructor/dashboard">Dashboard</Link>
                                    <Link href="/instructor/classes">Classes</Link>
                                </div>
                            ) : (
                                <div className="flex gap-4">
                                    <Link href="/student/dashboard">Dashboard</Link>
                                </div>
                            )}
                            <button onClick={handleSignOut} className="text-red-500">
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="px-4 py-2 hover:bg-gray-100 rounded">
                                Login
                            </Link>
                            <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}
