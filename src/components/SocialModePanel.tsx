import { useRef, useState, useCallback, useEffect } from 'react'
import { Image, Camera, Clipboard, X, Upload, MessageCircle } from 'lucide-react'
import type { ReplyStyle, ReplyStyleOption } from '../types'

interface SocialModePanelProps {
  screenshot: string | null
  onScreenshotChange: (screenshot: string | null) => void
  replyStyle: ReplyStyle
  onReplyStyleChange: (style: ReplyStyle) => void
  disabled?: boolean
}

const replyStyles: ReplyStyleOption[] = [
  {
    id: 'flirty',
    label: 'Flirty',
    emoji: '😏',
    description: 'Playful and teasing',
    color: 'from-pink-500 to-rose-500',
  },
  {
    id: 'engaging',
    label: 'Engaging',
    emoji: '✨',
    description: 'Keeps the conversation going',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'professional',
    label: 'Professional',
    emoji: '💼',
    description: 'Polished and respectful',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'friendly',
    label: 'Friendly',
    emoji: '😊',
    description: 'Warm and casual',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'witty',
    label: 'Witty',
    emoji: '😎',
    description: 'Clever and humorous',
    color: 'from-purple-500 to-violet-500',
  },
  {
    id: 'assertive',
    label: 'Assertive',
    emoji: '💪',
    description: 'Confident and direct',
    color: 'from-red-500 to-rose-600',
  },
  {
    id: 'supportive',
    label: 'Supportive',
    emoji: '🤗',
    description: 'Empathetic and caring',
    color: 'from-cyan-500 to-teal-500',
  },
]

export function SocialModePanel({
  screenshot,
  onScreenshotChange,
  replyStyle,
  onReplyStyleChange,
  disabled = false,
}: SocialModePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (disabled) return

      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            await processImageFile(file)
          }
          break
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [disabled])

  const processImageFile = async (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = (e.target?.result as string)?.split(',')[1]
      if (base64) {
        onScreenshotChange(base64)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      processImageFile(file)
    }
  }, [disabled])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleScreenCapture = async () => {
    if (disabled) return

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'window' } as MediaTrackConstraints,
      })

      const video = document.createElement('video')
      video.srcObject = stream
      await video.play()

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0)

      stream.getTracks().forEach(track => track.stop())

      const base64 = canvas.toDataURL('image/png').split(',')[1]
      onScreenshotChange(base64)
    } catch (err) {
      console.error('Screen capture failed:', err)
    }
  }

  const handlePasteFromClipboard = async () => {
    if (disabled) return

    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        const imageType = item.types.find(type => type.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          const reader = new FileReader()
          reader.onload = (e) => {
            const base64 = (e.target?.result as string)?.split(',')[1]
            if (base64) {
              onScreenshotChange(base64)
            }
          }
          reader.readAsDataURL(blob)
          break
        }
      }
    } catch (err) {
      console.error('Clipboard read failed:', err)
    }
  }

  return (
    <div className={`space-y-6 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* Screenshot Upload Area */}
      <div className="card-premium rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Image className="w-5 h-5 text-pink-400" />
          <h3 className="font-medium text-white/90">Conversation Screenshot</h3>
        </div>

        {screenshot ? (
          <div className="relative group">
            <img
              src={`data:image/png;base64,${screenshot}`}
              alt="Conversation screenshot"
              className="w-full max-h-64 object-contain rounded-xl border border-white/10"
            />
            <button
              onClick={() => onScreenshotChange(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/60 hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
              ${isDragging
                ? 'border-pink-500 bg-pink-500/10'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }
            `}
          >
            <Upload className="w-10 h-10 text-white/30 mx-auto mb-4" />
            <p className="text-white/60 mb-2">
              Drop a screenshot here, or paste with <kbd className="px-2 py-0.5 rounded bg-white/10 text-white/80 text-sm">Cmd+V</kbd>
            </p>
            <p className="text-white/40 text-sm mb-4">PNG, JPG up to 10MB</p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
              >
                <Image className="w-4 h-4" />
                Browse
              </button>
              <button
                onClick={handlePasteFromClipboard}
                className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
              >
                <Clipboard className="w-4 h-4" />
                Paste
              </button>
              <button
                onClick={handleScreenCapture}
                className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Capture
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Reply Style Selector */}
      <div className="card-premium rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-purple-400" />
          <h3 className="font-medium text-white/90">Reply Style</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {replyStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => onReplyStyleChange(style.id)}
              className={`
                reply-style-chip flex items-center gap-2 p-3 rounded-xl text-left
                ${replyStyle === style.id
                  ? `bg-gradient-to-r ${style.color} text-white shadow-lg`
                  : 'glass glass-hover text-white/70'
                }
              `}
            >
              <span className="text-lg">{style.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{style.label}</div>
              </div>
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm text-white/40 text-center">
          {replyStyles.find(s => s.id === replyStyle)?.description}
        </p>
      </div>

      {/* Instructions */}
      <p className="text-center text-sm text-white/40">
        Upload a screenshot, choose your style, then speak your thoughts
      </p>
    </div>
  )
}
