import { Check, AlertCircle } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
}

export function Toast({ message, type }: ToastProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in">
      <div
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg
          ${type === 'success'
            ? 'bg-green-500/90 text-white'
            : 'bg-red-500/90 text-white'
          }
        `}
      >
        {type === 'success' ? (
          <Check className="w-5 h-5" />
        ) : (
          <AlertCircle className="w-5 h-5" />
        )}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  )
}
