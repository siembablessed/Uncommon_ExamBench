import { AlertCircle, Check, Info } from "lucide-react"

interface MarkdownViewProps {
    content: string
    className?: string
}

export default function MarkdownView({ content, className = '' }: MarkdownViewProps) {
    if (!content) return <p className="text-slate-400 italic">No description provided.</p>

    const parseInline = (text: string) => {
        // Very basic parser: splits by ** for bold, * for italic
        const parts = text.split(/(\*\*.*?\*\*)/g)
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>
            }
            return part
        })
    }

    return (
        <div className={`prose prose-sm max-w-none text-slate-700 ${className}`}>
            {content.split('\n').map((line, index) => {
                // Headers
                if (line.startsWith('# ')) return <h1 key={index} className="text-2xl font-bold text-slate-900 mb-3 mt-6 border-b pb-2">{line.slice(2)}</h1>
                if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-bold text-slate-800 mb-2 mt-4">{line.slice(3)}</h2>

                // List Items
                if (line.startsWith('- ')) return <li key={index} className="ml-4 list-disc text-slate-700 mb-1 pl-1">{parseInline(line.slice(2))}</li>

                // Blockquotes / Alerts (Simple implementation)
                if (line.startsWith('> ')) {
                    return (
                        <div key={index} className="flex gap-3 bg-slate-50 border-l-4 border-indigo-500 p-3 my-2 rounded-r-lg">
                            <Info size={20} className="text-indigo-500 shrink-0 mt-0.5" />
                            <p className="m-0 text-slate-700">{parseInline(line.slice(2))}</p>
                        </div>
                    )
                }

                // Paragraphs (handle empty lines)
                if (line.trim() === '') return <div key={index} className="h-2"></div>

                return <p key={index} className="mb-2 leading-relaxed">{parseInline(line)}</p>
            })}
        </div>
    )
}
