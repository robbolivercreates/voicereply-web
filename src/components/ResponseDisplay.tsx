import { useRef, useEffect, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import type { TranscriptionMode } from '../types'
import { playClickSound } from '../lib/sounds'

interface Message {
  result: string
  transcription: string | null
}

interface ResponseDisplayProps {
  messages: Message[]
  mode: TranscriptionMode | null
  error: string | null
  isLoading: boolean
  onCopy: () => void
}

export function ResponseDisplay({
  messages,
  mode,
  error,
  isLoading,
  onCopy,
}: ResponseDisplayProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, error])

  const handleCopy = async (text: string, index: number) => {
    playClickSound()
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback for browsers that block async clipboard (e.g. older iOS)
      const el = document.createElement('textarea')
      el.value = text
      el.style.cssText = 'position:fixed;opacity:0;top:0;left:0'
      document.body.appendChild(el)
      el.focus()
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
    onCopy()
  }

  const isEmpty = messages.length === 0 && !isLoading && !error

  return (
    <div className="w-full h-full flex flex-col font-mono text-sm leading-relaxed tracking-wide">

      {/* Minimalist Header */}
      <div className="border-b border-divider/50 pb-3 mb-4 flex justify-between items-end opacity-60 flex-shrink-0">
        <span className="text-[9px] uppercase tracking-[0.3em] font-sans text-text-muted">
          {messages.length > 0 ? `${messages.length} MSG` : 'STANDBY'}
        </span>
        <span className="text-[9px] uppercase tracking-[0.3em] font-sans text-accent/80">
          {mode || 'TEXT'}
        </span>
      </div>

      {/* Scrollable messages list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-5 pr-1">

        {messages.map((msg, i) => {
          const isLatest = i === messages.length - 1
          const isCopied = copiedIndex === i
          return (
            <div
              key={i}
              className={`flex flex-col gap-2 transition-opacity duration-500 animate-in fade-in slide-in-from-bottom-2
                ${isLatest ? 'opacity-100' : 'opacity-40'}
              `}
            >
              {/* What the user said */}
              {msg.transcription && (
                <p className="text-[11px] font-mono text-text-muted italic truncate px-1">
                  "{msg.transcription}"
                </p>
              )}

              {/* AI Reply card */}
              <div className={`rounded-2xl border overflow-hidden
                ${isLatest ? 'bg-white/[0.05] border-divider' : 'bg-transparent border-divider/20'}`}
              >
                <p className="text-text-main font-mono whitespace-pre-wrap leading-loose text-[13px] px-4 pt-4 pb-3">
                  {msg.result}
                </p>

                {/* Full-width copy button — optimised for mobile tap targets */}
                <button
                  onClick={() => handleCopy(msg.result, i)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 border-t transition-all duration-200 active:scale-[0.98]
                    ${isCopied
                      ? 'border-accent/30 bg-accent/10 text-accent'
                      : 'border-divider/20 text-text-muted/50 hover:text-text-muted hover:bg-white/5'
                    }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono tracking-[0.2em] uppercase">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono tracking-[0.2em] uppercase">Copy Reply</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}

        {/* Loading pulse */}
        {isLoading && (
          <div className="flex flex-col gap-2 animate-in fade-in duration-300">
            <p className="text-[11px] font-mono text-text-muted/40 italic px-1">Processing...</p>
            <div className="flex items-center gap-1.5 px-4 py-4 border border-divider/20 rounded-2xl">
              <span className="inline-block w-1.5 h-3 bg-accent/60 animate-pulse rounded-sm" />
              <span className="inline-block w-1.5 h-3 bg-accent/40 animate-pulse rounded-sm [animation-delay:150ms]" />
              <span className="inline-block w-1.5 h-3 bg-accent/20 animate-pulse rounded-sm [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-red-400 text-xs border border-red-900/50 p-4 bg-red-950/20 font-mono rounded-2xl font-bold">
            [SYS_ERR]: {error}
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted/20 pb-8 mt-8">
            <span className="text-[9px] font-sans uppercase tracking-[0.4em]">Hold to speak</span>
          </div>
        )}

        <div ref={bottomRef} className="h-2 flex-shrink-0" />
      </div>
    </div>
  )
}
