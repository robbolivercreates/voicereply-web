import { useRef, useEffect } from 'react'
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

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, error])

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

        {/* Accumulated messages — last 4, oldest at top, newest at bottom */}
        {messages.map((msg, i) => {
          const isLatest = i === messages.length - 1
          return (
            <div
              key={i}
              className={`flex flex-col gap-2 transition-opacity duration-500 animate-in fade-in slide-in-from-bottom-2
                ${isLatest ? 'opacity-100' : 'opacity-40'}
              `}
            >
              {/* Transcription (what user said) */}
              {msg.transcription && (
                <p className="text-[11px] font-mono text-text-muted italic truncate">
                  "{msg.transcription}"
                </p>
              )}

              {/* AI Reply */}
              <div className={`relative rounded-2xl px-4 py-3 border
                  ${isLatest
                  ? 'bg-white/[0.05] border-divider'
                  : 'bg-transparent border-divider/20'
                }`}
              >
                <p className="text-text-main font-mono whitespace-pre-wrap leading-loose text-[13px]">
                  {msg.result}
                </p>

                {/* Copy button — only on latest */}
                {isLatest && (
                  <button
                    onClick={() => { playClickSound(); onCopy() }}
                    className="absolute top-2 right-2 text-[8px] font-sans text-text-muted/40 hover:text-accent uppercase tracking-widest cursor-pointer transition-colors px-2 py-1 rounded border border-transparent hover:border-divider/50"
                  >
                    copy
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* Loading pulse — appears at bottom while processing */}
        {isLoading && (
          <div className="flex flex-col gap-2 animate-in fade-in duration-300">
            <p className="text-[11px] font-mono text-text-muted/40 italic">Processing...</p>
            <div className="flex items-center gap-1.5 px-4 py-3 border border-divider/20 rounded-2xl">
              <span className="inline-block w-1.5 h-3 bg-accent/60 animate-pulse rounded-sm delay-0" />
              <span className="inline-block w-1.5 h-3 bg-accent/40 animate-pulse rounded-sm delay-150" />
              <span className="inline-block w-1.5 h-3 bg-accent/20 animate-pulse rounded-sm delay-300" />
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
            <span className="text-[9px] font-sans uppercase tracking-[0.4em]">Hold the button to speak</span>
          </div>
        )}

        <div ref={bottomRef} className="h-2 flex-shrink-0" />
      </div>
    </div>
  )
}
