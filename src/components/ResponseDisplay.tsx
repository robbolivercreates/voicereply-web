import { useRef, useEffect } from 'react'
import type { TranscriptionMode } from '../types'
import { playClickSound } from '../lib/sounds'

interface ResponseDisplayProps {
  response: string | null
  transcription: string | null
  mode: TranscriptionMode | null
  error: string | null
  isLoading: boolean
  onCopy: () => void
}

export function ResponseDisplay({
  response,
  transcription,
  mode,
  error,
  isLoading,
  onCopy,
}: ResponseDisplayProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll
  useEffect(() => {
    if (response || transcription || isLoading || error) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [response, transcription, isLoading, error])

  return (
    <div className="w-full h-full flex flex-col font-mono text-sm md:text-base leading-relaxed tracking-wide">

      {/* Minimalist Elegant Header */}
      <div className="border-b border-divider/50 pb-3 mb-6 flex justify-between items-end opacity-60">
        <span className="text-[9px] uppercase tracking-[0.3em] font-sans text-text-muted">
          SEQ: {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="text-[9px] uppercase tracking-[0.3em] font-sans text-accent/80">
          {mode || 'STANDBY'}
        </span>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-8 pr-2">

        {/* User Transcription Block */}
        {(transcription || isLoading) && (
          <div className="flex flex-col gap-2 opacity-70">
            <span className="text-[8px] font-sans text-text-muted uppercase tracking-[0.2em]">Input Transcription</span>
            <p className="text-text-muted whitespace-pre-wrap font-mono italic">
              "{transcription}"
              {isLoading && <span className="animate-pulse inline-block ml-1 w-1.5 h-3 bg-accent/50 align-middle"></span>}
            </p>
          </div>
        )}

        {/* AI Response Block */}
        {response && (
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-sans text-accent uppercase tracking-[0.2em] font-bold">System Output</span>
              <button
                onClick={() => {
                  playClickSound()
                  onCopy()
                }}
                className="text-[9px] font-sans text-text-muted hover:text-accent uppercase tracking-widest cursor-pointer transition-colors px-2 py-1 rounded border border-transparent hover:border-divider"
              >
                Copy Text
              </button>
            </div>

            <div className="relative pl-0">
              <p className="text-text-main font-mono whitespace-pre-wrap leading-loose drop-shadow-sm">
                {response}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-400 text-xs border border-red-900/50 p-4 bg-red-950/20 font-mono rounded font-bold shadow-mechanical-inset">
            [SYS_ERR]: {error}
          </div>
        )}

        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Empty State / Hint */}
      {!transcription && !response && !isLoading && !error && (
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted/30 pb-12">
          <span className="text-[9px] font-sans uppercase tracking-[0.4em]">Awaiting Input</span>
        </div>
      )}

    </div>
  )
}
