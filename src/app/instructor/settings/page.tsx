'use client'

import DeleteAccountSection from '@/components/DeleteAccountSection'

export default function InstructorSettingsPage() {
    return (
        <div className="container mx-auto px-6 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
            <p className="text-slate-500 mb-8">Manage your account preferences</p>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-8">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Profile Information</h2>
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                        To update your profile information, please contact support or your administrator.
                    </p>
                </div>
            </div>

            <DeleteAccountSection />
        </div>
    )
}
