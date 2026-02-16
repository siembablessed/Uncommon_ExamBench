'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Camera, Save, Loader2 } from 'lucide-react'

export default function StudentSettingsPage() {
    const [user, setUser] = useState<any>(null)
    const [fullName, setFullName] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

    useEffect(() => {
        const getProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                setUser(user)

                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', user.id)
                    .single()

                if (error && error.code !== 'PGRST116') {
                    throw error
                }

                if (profile) {
                    setFullName(profile.full_name || '')
                    setAvatarUrl(profile.avatar_url || '')
                }
            } catch (error) {
                console.error('Error loading user:', error)
            } finally {
                setLoading(false)
            }
        }

        getProfile()
    }, [])

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id)

            if (error) throw error
            setMessage({ text: 'Profile updated successfully!', type: 'success' })
        } catch (error: any) {
            setMessage({ text: error.message || 'Error updating profile', type: 'error' })
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            setMessage(null)

            if (!e.target.files || e.target.files.length === 0) {
                throw new Error('You must select an image to upload.')
            }

            const file = e.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}-${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            setAvatarUrl(publicUrl)
            setMessage({ text: 'Image uploaded! Click Save to apply.', type: 'success' })

        } catch (error: any) {
            setMessage({ text: error.message || 'Error uploading image', type: 'error' })
        } finally {
            setUploading(false)
        }
    }

    if (loading) return <div className="p-8 text-center" suppressHydrationWarning>Loading settings...</div>

    return (
        <div className="container mx-auto px-6 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Account Settings</h1>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <form onSubmit={handleUpdateProfile} className="space-y-8">

                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-md">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <User size={48} />
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors">
                                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                        <p className="text-sm text-slate-500">Allowed *.jpeg, *.jpg, *.png, *.gif</p>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="input-field w-full"
                                placeholder="Your Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                type="text"
                                value={user?.email}
                                disabled
                                className="input-field w-full bg-slate-50 text-slate-500 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        {message && (
                            <span className={`text-sm ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {message.text}
                            </span>
                        )}
                        <button
                            type="submit"
                            className="btn-primary flex items-center gap-2 ml-auto"
                            disabled={uploading}
                        >
                            <Save size={18} /> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
