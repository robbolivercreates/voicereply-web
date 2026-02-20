import { useState, useMemo } from 'react'
import { X, Trash2, Copy, Check, Search } from 'lucide-react'
import { playClickSound } from '../lib/sounds'
import type { HistoryItem } from '../types'

interface HistoryModalProps {
  history: HistoryItem[]
  onClose: () => void
  onSelect: (item: HistoryItem) => void
  onClear: () => void
}

const modeLabels: Record<string, string> = {
  text: 'TEXT',
  email: 'EMAIL',
  social: 'SOCIAL',
  translate: 'TRANSLATE',
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} | ${hh}:${min}`
}

export function HistoryModal({ history, onClose, onSelect, onClear }: HistoryModalProps) {
  const [query, setQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return history
    return history.filter(item =>
      item.result.toLowerCase().includes(q) ||
      (modeLabels[item.mode] || item.mode).toLowerCase().includes(q)
    )
  }, [history, query])

  const handleCopy = async (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation()
    playClickSound()
    try {
      await navigator.clipboard.writeText(item.result)
      setCopiedId(item.id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch { /* ignore */ }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-screen"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-200">
        <span className="text-[10px] font-sans font-bold tracking-widest text-text-muted uppercase">
          Transcription Log
        </span>
        <div className="flex items-center gap-4">
          {history.length > 0 && (
            <button
              onClick={() => { playClickSound(); onClear() }}
              className="flex items-center gap-1 text-[9px] font-sans font-bold tracking-widest text-red-400 hover:text-red-600 uppercase transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear all
            </button>
          )}
          <button
            onClick={() => { playClickSound(); onClose() }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-text-muted/50 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search"
            className="flex-1 bg-transparent text-[12px] font-sans text-text-main placeholder:text-text-muted/40 focus:outline-none"
            autoFocus
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <span className="text-[11px] font-mono text-text-muted/40 uppercase tracking-widest">
              {query ? 'No results' : 'No entries yet'}
            </span>
          </div>
        ) : (
          filtered.map(item => (
            <button
              key={item.id}
              onClick={() => { playClickSound(); onSelect(item) }}
              className="w-full text-left px-5 py-4 border-b border-gray-200/70 hover:bg-gray-100/60 active:bg-gray-200/60 transition-colors group flex items-start justify-between gap-3"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                {/* Date | Mode */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-text-muted">
                    {formatDate(item.timestamp)}
                  </span>
                  <span className="text-[9px] font-sans font-bold tracking-widest text-accent uppercase">
                    {modeLabels[item.mode] || item.mode}
                  </span>
                </div>
                {/* Preview */}
                <p className="text-[12px] font-mono text-text-main/70 line-clamp-1 leading-relaxed">
                  {item.result}
                </p>
              </div>

              {/* Copy button */}
              <button
                onClick={(e) => handleCopy(item, e)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200 flex-shrink-0 mt-0.5"
              >
                {copiedId === item.id
                  ? <Check className="w-4 h-4 text-green-500" />
                  : <Copy className="w-4 h-4 text-text-muted" />}
              </button>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-200 flex justify-between items-center">
        <span className="text-[9px] font-mono text-text-muted/30 uppercase tracking-widest">
          {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
        </span>
        <span className="text-[9px] font-mono text-text-muted/30 uppercase tracking-widest">
          BRAUN LOG SYSTEM
        </span>
      </div>
    </div>
  )
}
