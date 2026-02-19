'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle } from 'lucide-react'

export default function DeleteAccountSection() {
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const router = useRouter()

    const handleDeleteAccount = async () => {
        setLoading(true)
        try {
            const { error } = await supabase.rpc('delete_account')
            if (error) throw error

            await supabase.auth.signOut()
            router.push('/')
        } catch (error: any) {
            console.error('Error deleting account:', error)
            alert('Failed to delete account: ' + error.message)
            setLoading(false)
        }
    }

    return (
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 mt-8">
            <h3 className="text-lg font-bold text-red-700 flex items-center gap-2 mb-2">
                <AlertTriangle size={20} /> Danger Zone
            </h3>
            <p className="text-red-600/80 mb-6 text-sm">
                Deleting your account is permanent. All your data, including classes, exams, and submissions, will be permanently removed. This action cannot be undone.
            </p>

            {!confirmOpen ? (
                <button
                    onClick={() => setConfirmOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors font-medium text-sm"
                >
                    <Trash2 size={16} /> Delete My Account
                </button>
            ) : (
                <div className="bg-white p-4 rounded-lg border border-red-200">
                    <p className="text-sm font-bold text-slate-800 mb-3">Are you absolutely sure?</p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDeleteAccount}
                            disabled={loading}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            {loading ? 'Deleting...' : 'Yes, Delete Everything'}
                        </button>
                        <button
                            onClick={() => setConfirmOpen(false)}
                            disabled={loading}
                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
