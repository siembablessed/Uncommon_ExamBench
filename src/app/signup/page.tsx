'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const HUBS = [
    'Dzivarasekwa',
    'Mufakose',
    'Warren Park',
    'Kambuzuma',
    'Mbare',
    'Victoria Falls',
    'Bulawayo'
]

export default function SignupPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [role, setRole] = useState<'student' | 'instructor'>('student')
    const [hub, setHub] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // Domain restriction for instructors
        if (role === 'instructor' && !email.endsWith('@uncommon.org')) {
            setError('Instructor accounts are restricted to @uncommon.org emails only.')
            setLoading(false)
            return
        }

        if (!hub) {
            setError('Please select your Hub location.')
            setLoading(false)
            return
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role,
                    hub: hub,
                },
            },
        })

        if (error) {
            if (error.message.includes('rate limit')) {
                setError('Too many signup attempts. Please wait a while before trying again.')
            } else {
                setError(error.message)
            }
            setLoading(false)
        } else {
            router.push('/login?message=Check your email for confirmation')
        }
    }

    return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 px-4 py-12">
            <div className="w-full max-w-md card">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Create an Account</h2>
                    <p className="text-slate-500 mt-2">Join Bvunzo today</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            minLength={3}
                            className="input-field"
                            placeholder="John Doe (min 3 chars)"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="input-field"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="input-field"
                            placeholder="Create a strong password"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Select Hub</label>
                        <select
                            value={hub}
                            onChange={(e) => setHub(e.target.value)}
                            required
                            className="input-field"
                        >
                            <option value="">Select a location...</option>
                            {HUBS.map((h) => (
                                <option key={h} value={h}>{h}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">I am a...</label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className={`cursor-pointer border rounded-lg p-4 text-center transition-all ${role === 'student' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium' : 'border-slate-200 hover:border-slate-300'}`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="student"
                                    checked={role === 'student'}
                                    onChange={() => setRole('student')}
                                    className="hidden"
                                />
                                Student
                            </label>
                            <label className={`cursor-pointer border rounded-lg p-4 text-center transition-all ${role === 'instructor' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium' : 'border-slate-200 hover:border-slate-300'}`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="instructor"
                                    checked={role === 'instructor'}
                                    onChange={() => setRole('instructor')}
                                    className="hidden"
                                />
                                Instructor
                            </label>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-2.5 mt-2"
                    >
                        {loading ? 'Creating Account...' : 'Get Started'}
                    </button>
                </form>
                <p className="text-center text-sm text-slate-600 mt-6">
                    Already have an account? <Link href="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    )
}
