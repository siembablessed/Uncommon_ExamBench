'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Upload, Calendar, FileText, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

import { toast } from 'sonner'

export default function CreateExamPage() {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [classes, setClasses] = useState<any[]>([])

    // Form state
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [classId, setClassId] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [duration, setDuration] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [answersFile, setAnswersFile] = useState<File | null>(null) // New: Marking Scheme

    // AI & Parser State
    const [activeTab, setActiveTab] = useState<'upload' | 'ai' | 'parser'>('upload')
    const [isGenerating, setIsGenerating] = useState(false)
    const [aiTopic, setAiTopic] = useState('')
    const [questions, setQuestions] = useState<any[]>([])

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0])
        }
    }

    const handleAnswersFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setAnswersFile(e.target.files[0])
        }
    }

    const handleParserImport = async () => {
        if (!file) {
            toast.error('Please upload a PDF first')
            return
        }
        setIsGenerating(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            if (answersFile) {
                formData.append('answersFile', answersFile)
            }

            const res = await fetch('/api/exams/parse-pdf', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Parsing failed')

            if (data.questions) {
                setQuestions(data.questions)
                setTitle(file.name.replace('.pdf', '') + ' (Imported)')
                setDescription('Imported from PDF via Rule-Based Parser')
                toast.success('Questions imported successfully')
            }
        } catch (error: any) {
            console.error('Import failed:', error)
            toast.error('Import failed: ' + error.message)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleAiGenerate = async () => {
        if (!file && !aiTopic) {
            toast.error('Please upload a PDF or enter a topic for AI generation')
            return
        }

        setIsGenerating(true)
        try {
            const formData = new FormData()
            formData.append('topic', aiTopic)
            if (file) {
                formData.append('file', file)
            }

            const res = await fetch('/api/ai/generate-exam', {
                method: 'POST',
                body: formData
            })

            const responseText = await res.text()

            let data
            try {
                data = JSON.parse(responseText)
            } catch (e) {
                console.error('Failed to parse response:', responseText)
                throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}...`)
            }

            if (data.error) throw new Error(data.error)

            if (data.questions) {
                setQuestions(data.questions)
                setTitle(aiTopic ? `${aiTopic} Exam` : 'AI Generated Exam')
                setDescription(`AI Generated Exam containing ${data.questions.length} questions.`)
                toast.success('AI generation complete')
            }

        } catch (error: any) {
            console.error('Generation failed:', error)
            toast.error('Generation failed: ' + error.message)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleDeleteQuestion = (index: number) => {
        const newQuestions = [...questions]
        newQuestions.splice(index, 1)
        setQuestions(newQuestions)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!classId || !dueDate) {
            toast.error('Please fill in all fields')
            return
        }

        if (activeTab === 'parser' && questions.length === 0) {
            toast.error('Please click "Import Exam" to generate questions first.')
            return
        }
        if (activeTab === 'ai' && questions.length === 0) {
            toast.error('Please click "Generate Exam Content" first.')
            return
        }

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            let fileUrl = null

            if (file) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${Date.now()}.${fileExt}`
                const filePath = `${user.id}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('exams')
                    .upload(filePath, file)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('exams')
                    .getPublicUrl(filePath)

                fileUrl = publicUrl
            }

            // Insert record
            const { error: insertError } = await supabase
                .from('exams')
                .insert({
                    title,
                    description,
                    class_id: classId,
                    due_date: new Date(dueDate).toISOString(),
                    created_by: user.id,
                    file_url: fileUrl,
                    duration_minutes: duration ? parseInt(duration) : null,
                    questions: questions.length > 0 ? questions : null // JSONB
                })

            if (insertError) throw insertError

            toast.success('Exam created successfully!')
            router.push('/instructor/dashboard')
            router.refresh()

        } catch (error: any) {
            console.error('Error creating exam:', error)
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

            <h1 className="text-3xl font-bold text-slate-900 mb-8">Create New Exam</h1>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'upload' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Upload size={18} /> Upload PDF
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('parser')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'parser' ? 'bg-emerald-50 text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-emerald-600'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <FileText size={18} /> Import PDF
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'ai' ? 'bg-violet-50 text-violet-600 border-b-2 border-violet-600' : 'text-slate-500 hover:text-violet-600'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span className="bg-violet-200 text-violet-800 text-[10px] px-1.5 py-0.5 rounded-full">AI</span> Generate
                        </div>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">

                    {activeTab === 'parser' && (
                        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 mb-6">
                            <h3 className="font-bold text-emerald-900 mb-4">📄 Rule-Based Parser (No AI)</h3>
                            <div className="space-y-4">
                                <p className="text-sm text-emerald-800">
                                    Upload a PDF formatted with numbered questions and lettered options.<br />
                                    Example:<br />
                                    <span className="font-mono bg-white px-1 rounded">1. What is 2+2?</span><br />
                                    <span className="font-mono bg-white px-1 rounded">A. 3</span><br />
                                    <span className="font-mono bg-white px-1 rounded">B. 4</span>
                                </p>
                                <div>
                                    <label className="block text-sm font-medium text-emerald-900 mb-1">1. Upload Questions PDF</label>
                                    <input type="file" accept=".pdf" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-emerald-900 mb-1">2. Upload Marking Scheme (Optional)</label>
                                    <p className="text-xs text-emerald-700 mb-2">Upload a second PDF containing answers (e.g. "1. A", "2. B")</p>
                                    <input type="file" accept=".pdf" onChange={handleAnswersFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200" />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleParserImport}
                                    disabled={isGenerating}
                                    className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isGenerating ? 'Parsing Questions & Answers...' : 'Import Exam'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ai' && (
                        <div className="bg-violet-50 p-6 rounded-xl border border-violet-100 mb-6">
                            <h3 className="font-bold text-violet-900 mb-4">✨ AI Exam Generator</h3>
                            <div className="space-y-4">
                                {questions.length === 0 && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-violet-900 mb-1">Topic / Subject</label>
                                            <input
                                                type="text"
                                                value={aiTopic}
                                                onChange={(e) => setAiTopic(e.target.value)}
                                                placeholder="e.g. European History, Calculus Integration"
                                                className="w-full p-2 border border-violet-200 rounded focus:ring-violet-500 focus:border-violet-500"
                                            />
                                        </div>
                                        <div className="text-center text-sm text-violet-600 font-medium">- OR -</div>
                                        <div>
                                            <label className="block text-sm font-medium text-violet-900 mb-1">Upload Reference PDF (Optional)</label>
                                            <input type="file" accept=".pdf" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-100 file:text-violet-700 hover:file:bg-violet-200" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAiGenerate}
                                            disabled={isGenerating}
                                            className="w-full bg-violet-600 text-white py-2 rounded-lg hover:bg-violet-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isGenerating ? 'Generating Questions...' : 'Generate Exam Content'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {(activeTab === 'ai' || activeTab === 'parser') && questions.length > 0 && (
                        <div className="mb-6 bg-white p-4 rounded border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-slate-900">Preview ({questions.length} Questions):</h4>
                                <button type="button" onClick={() => setQuestions([])} className="text-xs text-red-500 underline">Clear</button>
                            </div>
                            <ul className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {questions.map((q: any, i: number) => (
                                    <li key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative group transition-all hover:border-indigo-300">
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteQuestion(i)}
                                            className="absolute top-3 right-3 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                                            title="Remove Question"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                        </button>
                                        <p className="font-medium text-slate-800 pr-8 mb-3 text-base">
                                            <span className="text-indigo-600 font-bold mr-2">{i + 1}.</span>
                                            {q.text || q.question}
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                                            {q.options?.map((opt: string, idx: number) => {
                                                const isCorrect = opt === q.correctAnswer
                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => {
                                                            const newQuestions = [...questions]
                                                            newQuestions[i].correctAnswer = opt
                                                            setQuestions(newQuestions)
                                                        }}
                                                        className={`text-left text-sm px-3 py-2 rounded-md transition-all border w-full flex items-center justify-between group/btn ${isCorrect
                                                            ? 'bg-emerald-100 text-emerald-900 border-emerald-500 font-semibold shadow-sm ring-1 ring-emerald-500'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        <span className="flex items-center">
                                                            <span className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full border mr-3 ${isCorrect ? 'border-emerald-600 bg-emerald-200 text-emerald-800 font-bold' : 'border-slate-300 text-slate-500 bg-slate-50'}`}>
                                                                {String.fromCharCode(65 + idx)}
                                                            </span>
                                                            {opt}
                                                        </span>
                                                        {isCorrect && (
                                                            <span className="text-emerald-600 bg-white rounded-full p-0.5 shadow-sm">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                            </span>
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        {!q.correctAnswer && (
                                            <div className="mt-2 text-xs text-amber-600 font-medium flex items-center gap-1 pl-6">
                                                <AlertCircle size={12} /> Please select the correct answer
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Exam Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="input-field"
                            required
                            placeholder="e.g. Midterm Physics"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input-field h-24"
                            placeholder="Instructions for students..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
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

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Minutes)</label>
                            <input
                                type="number"
                                min="1"
                                placeholder="e.g. 60 (Optional)"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="input-field"
                            />
                        </div>
                    </div>

                    {activeTab === 'upload' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Exam PDF</label>
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition cursor-pointer relative group">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    required={activeTab === 'upload'}
                                />
                                {file ? (
                                    <div className="flex items-center justify-center gap-2 text-indigo-600 bg-indigo-50 py-2 rounded">
                                        <FileText size={20} />
                                        <span className="font-medium">{file.name}</span>
                                    </div>
                                ) : (
                                    <div className="text-slate-500 group-hover:text-indigo-600 transition-colors">
                                        <Upload size={32} className="mx-auto mb-3 opacity-50 group-hover:opacity-100" />
                                        <p className="font-medium">Click or drag PDF here</p>
                                        <p className="text-xs text-slate-400 mt-1">PDF up to 10MB</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-3 text-lg mt-4"
                    >
                        {loading ? 'Publishing...' : 'Publish Exam'}
                    </button>

                </form>
            </div>
        </div>
    )
}
