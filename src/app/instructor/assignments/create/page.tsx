'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, FileText, Upload } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import RichTextEditor from '@/components/RichTextEditor'

export default function CreateAssignmentPage() {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [classes, setClasses] = useState<any[]>([])

    // Form state
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [classId, setClassId] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [points, setPoints] = useState('100')
    const [penaltyEnabled, setPenaltyEnabled] = useState(true)
    const [penaltyAmount, setPenaltyAmount] = useState('15')

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (user) {
                const { data } = await supabase
                    .from('classes')
                    .select('id, name')
                    .eq('instructor_id', user.id)

                if (data) setClasses(data)
                if (data && data.length > 0) setClassId(data[0].id)
            }
        })
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!classId || !dueDate || !title) {
            toast.error('Please fill in all required fields')
            return
        }

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Insert record
            const { error: insertError } = await supabase
                .from('assignments')
                .insert({
                    title,
                    description,
                    class_id: classId,
                    due_date: new Date(dueDate).toISOString(),
                    points: parseInt(points),
                    late_penalty_amount: penaltyEnabled ? parseInt(penaltyAmount) : 0,
                    created_by: user.id
                })

            if (insertError) throw insertError

            toast.success('Assignment created successfully!')
            router.push('/instructor/dashboard')
            router.refresh()

        } catch (error: any) {
            console.error('Error creating assignment:', error)
            toast.error('Error: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl" suppressHydrationWarning>
            <Link href="/instructor/dashboard" className="flex items-center text-slate-500 hover:text-slate-900 mb-6 transition-colors">
                <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
            </Link>

            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <FileText size={24} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900">Create New Assignment</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-8 space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Assignment Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="input-field"
                            required
                            placeholder="e.g. Research Paper: The French Revolution"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description / Instructions</label>
                        <RichTextEditor
                            value={description}
                            onChange={setDescription}
                            placeholder="Detailed instructions for the students... (Supports Markdown: **bold**, - list)"
                            height="h-48"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Assign to Class</label>
                            <select
                                value={classId}
                                onChange={(e) => setClassId(e.target.value)}
                                className="input-field"
                                required
                            >
                                <option value="" disabled>Select a class</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                            {classes.length === 0 && <p className="text-xs text-red-500 mt-1">Create a class first!</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                            <input
                                type="datetime-local"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="input-field"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Total Points</label>
                            <input
                                type="number"
                                value={points}
                                onChange={(e) => setPoints(e.target.value)}
                                className="input-field"
                                min="1"
                            />
                        </div>

                        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-bold text-amber-900">Late Penalty</label>
                                <input
                                    type="checkbox"
                                    checked={penaltyEnabled}
                                    onChange={(e) => setPenaltyEnabled(e.target.checked)}
                                    className="accent-amber-600 w-4 h-4"
                                />
                            </div>
                            <p className="text-xs text-amber-700 mb-3 block">
                                Automatically deduct marks if submitted after due date.
                            </p>

                            {penaltyEnabled && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-amber-800 font-medium">-</span>
                                    <input
                                        type="number"
                                        value={penaltyAmount}
                                        onChange={(e) => setPenaltyAmount(e.target.value)}
                                        className="w-16 p-1 text-center border border-amber-200 rounded text-sm bg-white"
                                    />
                                    <span className="text-sm text-amber-800">marks</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-3 text-lg mt-4 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Publishing...' : 'Publish Assignment'}
                    </button>

                </form>
            </div>
        </div>
    )
}
