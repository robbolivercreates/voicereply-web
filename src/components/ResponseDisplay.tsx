import { Copy, X, Check, AlertCircle, Sparkles } from 'lucide-react'
import { useState } from 'react'

interface ResponseDisplayProps {
  response: string | null
  transcription: string | null
  error: string | null
  isLoading: boolean
  onCopy: () => void
  onClear: () => void
}

export function ResponseDisplay({
  response,
  transcription,
  error,
  isLoading,
  onCopy,
  onClear,
}: ResponseDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="card-premium rounded-2xl p-8">
        <div className="flex flex-col items-center gap-5">
          {/* Premium loading spinner */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-white/5" />
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent"
              style={{
                borderTopColor: 'rgba(99, 102, 241, 0.8)',
                borderRightColor: 'rgba(168, 85, 247, 0.6)',
                animation: 'spin 1s linear infinite',
              }}
            />
            <div
              className="absolute inset-2 rounded-full border-2 border-transparent"
              style={{
                borderTopColor: 'rgba(236, 72, 153, 0.6)',
                borderLeftColor: 'rgba(99, 102, 241, 0.4)',
                animation: 'spin 1.5s linear infinite reverse',
              }}
            />
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-white/60" />
          </div>
          <div className="text-center">
            <p className="text-white/80 font-medium">Generating response...</p>
            <p className="text-sm text-white/40 mt-1">Analyzing your input with Gemini AI</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card-premium rounded-2xl p-6 border border-red-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-red-400 font-medium">Something went wrong</p>
            <p className="text-white/50 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={onClear}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>
      </div>
    )
  }

  if (!response) return null

  return (
    <div className="card-premium rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-400" />
          <p className="text-sm font-medium text-white/60">Response</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
              transition-all duration-300
              ${copied
                ? 'bg-green-500/20 text-green-400'
                : 'bg-white/5 hover:bg-white/10 text-white/80'
              }
            `}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
          <button
            onClick={onClear}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
            title="Clear"
          >
            <X className="w-4 h-4 text-white/40" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Transcription (what user said) */}
        {transcription && (
          <div className="mb-4 pb-4 border-b border-white/5">
            <p className="text-xs text-white/40 mb-1.5">You said:</p>
            <p className="text-sm text-white/60 italic">"{transcription}"</p>
          </div>
        )}

        {/* Generated Response */}
        <div className="code-display rounded-xl p-5">
          <p className="text-white/90 whitespace-pre-wrap leading-relaxed text-[15px]">
            {response}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02]">
        <p className="text-xs text-white/30 text-center">
          Auto-copied to clipboard
        </p>
      </div>
    </div>
  )
}
