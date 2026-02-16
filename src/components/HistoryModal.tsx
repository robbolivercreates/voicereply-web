import { X, Trash2, Clock, Copy } from 'lucide-react'
import type { HistoryItem } from '../types'

interface HistoryModalProps {
  history: HistoryItem[]
  onClose: () => void
  onSelect: (item: HistoryItem) => void
  onClear: () => void
}

const modeLabels: Record<string, string> = {
  code: '💻 Code',
  text: '📝 Text',
  email: '✉️ Email',
  uxDesign: '🎨 UX Design',
  command: '✨ Command',
}

export function HistoryModal({ history, onClose, onSelect, onClear }: HistoryModalProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  const copyToClipboard = async (text: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Ignore
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in">
      <div className="glass rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">History</h2>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClear}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="w-12 h-12 text-slate-600 mb-4" />
              <p className="text-slate-400">No history yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Your transcriptions will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="w-full text-left glass rounded-xl p-4 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Mode & Time */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                          {modeLabels[item.mode] || item.mode}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatTime(item.timestamp)}
                        </span>
                      </div>

                      {/* Result Preview */}
                      <p className="text-sm text-slate-300 line-clamp-3 whitespace-pre-wrap font-mono">
                        {item.result}
                      </p>
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={(e) => copyToClipboard(item.result, e)}
                      className="p-2 rounded-lg hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                      title="Copy"
                    >
                      <Copy className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
