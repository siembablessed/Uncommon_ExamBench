import { useState, useRef } from 'react'
import { Bold, Italic, List, Heading1, Heading2, Link as LinkIcon, Eye, Edit3, Type } from 'lucide-react'

interface RichTextEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    height?: string
}

export default function RichTextEditor({ value, onChange, placeholder, height = 'h-64' }: RichTextEditorProps) {
    const [mode, setMode] = useState<'write' | 'preview'>('write')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const insertFormatting = (startChar: string, endChar: string = '') => {
        const textarea = textareaRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = textarea.value
        const selectedText = text.substring(start, end)

        const newText = text.substring(0, start) + startChar + selectedText + endChar + text.substring(end)

        // Update value
        onChange(newText)

        // Reset cursor position/selection after React re-render
        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start + startChar.length, end + startChar.length)
        }, 0)
    }

    // Simple Markdown Parser for Preview
    const renderMarkdown = (text: string) => {
        if (!text) return <p className="text-slate-400 italic">Nothing to preview</p>

        return text.split('\n').map((line, index) => {
            // Headers
            if (line.startsWith('# ')) return <h1 key={index} className="text-2xl font-bold text-slate-800 mb-2 mt-4 border-b pb-1">{line.slice(2)}</h1>
            if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-bold text-slate-800 mb-2 mt-3">{line.slice(3)}</h2>

            // List Items
            if (line.startsWith('- ')) return <li key={index} className="ml-4 list-disc text-slate-700 mb-1">{parseInline(line.slice(2))}</li>

            // Paragraphs (handle empty lines)
            if (line.trim() === '') return <div key={index} className="h-4"></div>

            return <p key={index} className="text-slate-700 mb-2 leading-relaxed">{parseInline(line)}</p>
        })
    }

    // Inline parser for Bold/Italic
    const parseInline = (text: string) => {
        // Very basic parser: splits by ** for bold, * for italic
        // Note: nesting not fully supported in this simple version
        const parts = text.split(/(\*\*.*?\*\*)/g)
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>
            }
            return part
        })
    }

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col transition-all focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => insertFormatting('**', '**')}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md transition-colors"
                        title="Bold"
                    >
                        <Bold size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => insertFormatting('*', '*')}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md transition-colors"
                        title="Italic"
                    >
                        <Italic size={16} />
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                    <button
                        type="button"
                        onClick={() => insertFormatting('# ')}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md transition-colors"
                        title="Heading 1"
                    >
                        <Heading1 size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => insertFormatting('## ')}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md transition-colors"
                        title="Heading 2"
                    >
                        <Heading2 size={16} />
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                    <button
                        type="button"
                        onClick={() => insertFormatting('- ')}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md transition-colors"
                        title="Bullet List"
                    >
                        <List size={16} />
                    </button>
                </div>

                <div className="flex bg-slate-200 rounded-lg p-0.5">
                    <button
                        type="button"
                        onClick={() => setMode('write')}
                        className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-all ${mode === 'write' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Edit3 size={12} /> Write
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('preview')}
                        className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-all ${mode === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Eye size={12} /> Preview
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            {mode === 'write' ? (
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full p-4 resize-y outline-none text-slate-700 text-sm leading-relaxed ${height}`}
                    placeholder={placeholder}
                />
            ) : (
                <div className={`w-full p-4 overflow-y-auto bg-slate-50/50 prose prose-sm max-w-none ${height}`}>
                    {renderMarkdown(value)}
                </div>
            )}

            <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between">
                <span>Markdown supported</span>
                <span>{value.length} characters</span>
            </div>
        </div>
    )
}
