import { X } from 'lucide-react'

export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md mx-auto rounded-3xl flex flex-col max-h-[88vh]">
        {/* Header fijo */}
        <div className="flex justify-between items-center px-5 pt-5 pb-3 flex-shrink-0">
          <h3 className="font-bold text-dark text-base">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        {/* Contenido scrollable */}
        <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-3">
          {children}
        </div>
      </div>
    </div>
  )
}
