import { useRef, useState, useCallback, useEffect } from 'react'
import { Camera, X, Copy, Check } from 'lucide-react'
import { playClickSound } from '../lib/sounds'
import type { ReplyStyle, ReplyStyleOption } from '../types'

interface SocialModePanelProps {
  screenshot: string | null
  onScreenshotChange: (screenshot: string | null) => void
  replyStyle: ReplyStyle
  onReplyStyleChange: (style: ReplyStyle) => void
  disabled?: boolean
  result?: string | null
  transcription?: string | null
  isLoading?: boolean
  onCopy?: () => void
}

const replyStyles: ReplyStyleOption[] = [
  { id: 'flirty', label: 'Flirty', emoji: '😏', description: 'Playful', color: 'text-pink-600' },
  { id: 'engaging', label: 'Engaging', emoji: '✨', description: 'Active', color: 'text-amber-600' },
  { id: 'professional', label: 'Pro', emoji: '💼', description: 'Polished', color: 'text-blue-600' },
  { id: 'friendly', label: 'Friendly', emoji: '😊', description: 'Warm', color: 'text-emerald-600' },
  { id: 'witty', label: 'Witty', emoji: '😎', description: 'Clever', color: 'text-purple-600' },
  { id: 'assertive', label: 'Direct', emoji: '💪', description: 'Bold', color: 'text-red-600' },
  { id: 'supportive', label: 'Caring', emoji: '🤗', description: 'Kind', color: 'text-teal-600' },
]

export function SocialModePanel({
  screenshot,
  onScreenshotChange,
  replyStyle,
  onReplyStyleChange,
  disabled = false,
  result,
  transcription,
  isLoading,
  onCopy,
}: SocialModePanelProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    playClickSound()
    onCopy?.()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // ... (Keep existing paste/drop handlers logic, simplified for brevity in replacement if exact logic is same)
  // Re-implementing handlers for safety

  const processImageFile = useCallback(async (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = (e.target?.result as string)?.split(',')[1]
      if (base64) onScreenshotChange(base64)
    }
    reader.readAsDataURL(file)
  }, [onScreenshotChange])

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (disabled) return
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) await processImageFile(file)
          break
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [disabled, processImageFile])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processImageFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) processImageFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  return (
    <div className={`flex flex-col gap-5 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>

      {/* Upload Zone */}
      <div
        className={`
          relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden cursor-pointer group
          ${isDragging
            ? 'border-accent bg-accent/5 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
            : 'border-divider hover:border-accent/40 hover:bg-white/[0.02]'
          }
          ${screenshot ? 'border-solid border-white/10 aspect-video' : 'aspect-video'}
        `}
        onClick={() => !screenshot && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
      >
        {screenshot ? (
          <>
            <img
              src={`data:image/png;base64,${screenshot}`}
              alt="Screenshot"
              className="w-full h-full object-cover rounded-2xl"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  playClickSound()
                  onScreenshotChange(null)
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-black/60 text-white text-[10px] font-mono tracking-widest uppercase hover:bg-black/80 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors duration-300 ${isDragging ? 'border-accent/60 bg-accent/10' : 'border-divider bg-white/5'}`}>
              <Camera className={`w-5 h-5 transition-colors duration-300 ${isDragging ? 'text-accent' : 'text-text-muted'}`} />
            </div>
            <div className="text-center">
              <p className="text-[11px] font-sans font-medium text-text-muted tracking-wide">
                Drop image, paste, or <span className="text-accent underline underline-offset-2">browse</span>
              </p>
              <p className="text-[9px] font-mono text-text-muted/40 tracking-widest uppercase mt-1">Optional Context</p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Reply Style Selector */}
      <div className="flex flex-col gap-2">
        <span className="text-[9px] font-mono tracking-[0.25em] text-text-muted/50 uppercase text-center">Reply Tone</span>
        <div className="flex flex-wrap justify-center gap-1.5">
          {replyStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => {
                playClickSound()
                onReplyStyleChange(style.id)
              }}
              className={`
                px-3 py-1.5 rounded-full text-[9px] font-mono tracking-widest uppercase border transition-all duration-200
                ${replyStyle === style.id
                  ? 'bg-accent/10 text-accent border-accent/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                  : 'text-text-muted/60 border-divider/50 hover:border-divider hover:text-text-muted hover:bg-white/5'
                }
              `}
              title={style.description}
            >
              {style.emoji} {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Result / Loading / Transcription ── */}
      {(result || transcription || isLoading) && (
        <div className="flex flex-col gap-3 mt-2 border-t border-divider/40 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">

          {/* What you said */}
          {transcription && (
            <div className="flex flex-col gap-1 opacity-60">
              <span className="text-[8px] font-mono tracking-[0.2em] text-text-muted uppercase">You said</span>
              <p className="text-[12px] font-mono text-text-muted italic">"{transcription}"</p>
            </div>
          )}

          {/* Generated reply */}
          {result && (
            <div className="relative bg-accent/5 border border-accent/20 rounded-2xl p-4">
              <span className="text-[8px] font-mono tracking-[0.2em] text-accent uppercase block mb-2">Your Reply</span>
              <p className="text-[13px] font-mono text-text-main leading-loose pr-8 whitespace-pre-wrap">{result}</p>
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 p-1.5 rounded-lg border border-transparent hover:border-accent/20 hover:bg-accent/5 transition-all"
              >
                {copied
                  ? <Check className="w-4 h-4 text-accent" />
                  : <Copy className="w-4 h-4 text-text-muted/50" />}
              </button>
            </div>
          )}

          {/* Loading */}
          {isLoading && !result && (
            <div className="flex items-center gap-2 text-text-muted/50">
              <span className="inline-block w-1.5 h-3 bg-accent/40 animate-pulse rounded-sm" />
              <span className="text-[10px] font-mono tracking-widest uppercase animate-pulse">Generating reply...</span>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
