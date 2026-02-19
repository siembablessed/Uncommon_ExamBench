'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, PlusCircle, Trash2, Save } from 'lucide-react'
import Link from 'next/link'

import { toast } from 'sonner' // Add import

export default function EditExamPage() {
    const supabase = createClient()
    // ...

    const fetchExamDetails = async () => {
        try {
            // ...
        } catch (error) {
            console.error('Error fetching exam:', error)
            toast.error('Failed to load exam details')
            router.push('/instructor/dashboard')
        } finally {
            setLoading(false)
        }
    }

    // ...

    const handleAddQuestion = () => {
        if (!newQuestion.text || !newQuestion.correctAnswer) {
            toast.error('Please enter question text and select a correct answer.')
            return
        }
        // ...
    }

    // ...

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const { error } = await supabase
                .from('exams')
                .update({
                    title,
                    description,
                    due_date: new Date(dueDate).toISOString(),
                    duration_minutes: duration ? parseInt(duration) : null,
                    questions: questions
                })
                .eq('id', examId)

            if (error) throw error

            toast.success('Exam updated successfully!')
            router.push('/instructor/dashboard')
            router.refresh()

        } catch (error: any) {
            console.error('Error updating exam:', error)
            toast.error('Error: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center">Loading exam details...</div>

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Link href="/instructor/dashboard" className="flex items-center text-slate-500 hover:text-slate-900 mb-6 transition-colors">
                <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
            </Link>

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Edit Exam</h1>
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="btn-primary flex items-center gap-2"
                >
                    <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Exam Details */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                        <h2 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Settings</h2>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="input-field"
                                required
                            />
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
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Min)</label>
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="input-field h-32"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Questions */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-bold text-slate-900">Questions ({questions.length})</h2>
                            <button
                                type="button"
                                onClick={() => setShowAddQuestion(!showAddQuestion)}
                                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                            >
                                <PlusCircle size={16} /> Add Question
                            </button>
                        </div>

                        {showAddQuestion && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-indigo-100 mb-6 animate-in fade-in slide-in-from-top-2">
                                <h3 className="text-sm font-bold text-slate-900 mb-3">New Question</h3>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Question text..."
                                        value={newQuestion.text}
                                        onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                                        className="input-field"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        {newQuestion.options.map((opt, i) => (
                                            <input
                                                key={i}
                                                type="text"
                                                placeholder={`Option ${i + 1}`}
                                                value={opt}
                                                onChange={(e) => handleOptionChange(i, e.target.value)}
                                                className={`input-field text-sm ${newQuestion.correctAnswer === opt && opt ? 'border-emerald-500 ring-1 ring-emerald-500' : ''}`}
                                            />
                                        ))}
                                    </div>
                                    <select
                                        value={newQuestion.correctAnswer}
                                        onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                                        className="input-field text-sm"
                                    >
                                        <option value="">Select Correct Answer</option>
                                        {newQuestion.options.map((opt, i) => (
                                            opt && <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button
                                            onClick={() => setShowAddQuestion(false)}
                                            className="px-3 py-1.5 text-slate-500 text-sm hover:bg-slate-200 rounded"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAddQuestion}
                                            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                                        >
                                            Add Question
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {questions.length === 0 ? (
                                <p className="text-center text-slate-400 py-8 italic">No structured questions. This might be a file-only exam.</p>
                            ) : (
                                questions.map((q, i) => (
                                    <div key={i} className="group relative bg-slate-50 p-4 rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors">
                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                            <button
                                                onClick={() => handleDeleteQuestion(i)}
                                                className="text-slate-400 hover:text-red-600 p-1 bg-white rounded-full shadow-sm"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <p className="font-medium text-slate-900 pr-8"><span className="text-slate-400 mr-2">{i + 1}.</span> {q.text || q.question}</p>
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                            {q.options?.map((opt: string, idx: number) => (
                                                <div key={idx} className={`text-xs px-2 py-1.5 rounded border ${opt === q.correctAnswer ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium' : 'bg-white text-slate-600 border-slate-200'}`}>
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
