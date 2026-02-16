'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Upload, Calendar, FileText, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreateExamPage() {
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

    // AI State
    const [activeTab, setActiveTab] = useState<'upload' | 'ai'>('upload')
    const [isGenerating, setIsGenerating] = useState(false)
    const [aiTopic, setAiTopic] = useState('')
    const [generatedExam, setGeneratedExam] = useState<any>(null)

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

    const handleAiGenerate = async () => {
        if (!file && !aiTopic) {
            alert('Please upload a PDF or enter a topic for AI generation')
            return
        }

        setIsGenerating(true)
        try {
            let extractedText = ''

            if (file) {
                // Client-side PDF Parsing
                try {
                    const arrayBuffer = await file.arrayBuffer()

                    // Dynamic import to avoid SSR issues
                    // @ts-ignore
                    const pdfjsLib = await import('pdfjs-dist')
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

                    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
                    const pdf = await loadingTask.promise

                    let fullText = ''
                    // Loop through each page
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i)
                        const textContent = await page.getTextContent()
                        const pageText = textContent.items.map((item: any) => item.str).join(' ')
                        fullText += pageText + '\n'
                    }

                    extractedText = fullText
                } catch (err: any) {
                    console.error('PDF Parse Error:', err)
                    alert('Failed to read PDF file. Please try another file or enter a topic.')
                    setIsGenerating(false)
                    return
                }
            }

            const res = await fetch('/api/ai/generate-exam', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: extractedText,
                    topic: aiTopic
                })
            })

            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setGeneratedExam(data)
            setTitle(data.title || title)
            setDescription(`AI Generated Exam containing ${data.questions?.length || 0} questions.`)

        } catch (error: any) {
            alert('Generation failed: ' + error.message)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!classId || !dueDate) {
            alert('Please fill in all fields')
            return
        }

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            let fileUrl = null

            // If tab is upload and file exists, upload it
            if (activeTab === 'upload' && file) {
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

            // If AI generated, we might want to save the JSON content instead of a file URL
            // For this prototype, we'll store the JSON in the description or a new column if schema allowed
            // But looking at schema, we have 'description'. Let's append the questions there for now
            // OR we can save the JSON as a text file in storage!

            if (activeTab === 'ai' && generatedExam) {
                const jsonString = JSON.stringify(generatedExam, null, 2)
                const fileName = `${Date.now()}_ai_exam.json`
                const filePath = `${user.id}/${fileName}`
                const blob = new Blob([jsonString], { type: 'application/json' })

                const { error: uploadError } = await supabase.storage
                    .from('exams')
                    .upload(filePath, blob)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('exams')
                    .getPublicUrl(filePath)

                fileUrl = publicUrl
            }

            // 2. Insert record
            const { error: insertError } = await supabase
                .from('exams')
                .insert({
                    title,
                    description: activeTab === 'ai' ? description + '\n\n' + JSON.stringify(generatedExam) : description, // Fallback storage
                    class_id: classId,
                    due_date: new Date(dueDate).toISOString(),
                    created_by: user.id,
                    file_url: fileUrl,
                    duration_minutes: duration ? parseInt(duration) : null
                })

            if (insertError) throw insertError

            alert('Exam created successfully!')
            router.push('/instructor/dashboard')

        } catch (error: any) {
            console.error('Error creating exam:', error)
            alert('Error: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
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
                        onClick={() => setActiveTab('ai')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'ai' ? 'bg-violet-50 text-violet-600 border-b-2 border-violet-600' : 'text-slate-500 hover:text-violet-600'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span className="bg-violet-200 text-violet-800 text-[10px] px-1.5 py-0.5 rounded-full">AI</span> Generate Exam
                        </div>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">

                    {activeTab === 'ai' && (
                        <div className="bg-violet-50 p-6 rounded-xl border border-violet-100 mb-6">
                            <h3 className="font-bold text-violet-900 mb-4">✨ AI Exam Generator</h3>
                            <div className="space-y-4">
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
                            </div>

                            {generatedExam && (
                                <div className="mt-6 bg-white p-4 rounded border border-violet-200">
                                    <h4 className="font-bold text-slate-900 mb-2">Preview:</h4>
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 max-h-40 overflow-y-auto">
                                        {generatedExam.questions?.map((q: any, i: number) => (
                                            <li key={i}>{q.question}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
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
