import { FormEvent } from 'react'

interface CreateClassModalProps {
    newClassName: string
    setNewClassName: (name: string) => void
    handleCreateClass: (e: FormEvent) => void
    onCancel: () => void
}

export default function CreateClassModal({ newClassName, setNewClassName, handleCreateClass, onCancel }: CreateClassModalProps) {
    return (
        <div className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-indigo-100 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Create New Class</h3>
            <form onSubmit={handleCreateClass} className="flex gap-3">
                <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="e.g. Advanced Biology 101"
                    className="input-field flex-1"
                    required
                />
                <button type="submit" className="btn-primary bg-emerald-600 hover:bg-emerald-700">
                    Create Class
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="btn-secondary"
                >
                    Cancel
                </button>
            </form>
        </div>
    )
}
