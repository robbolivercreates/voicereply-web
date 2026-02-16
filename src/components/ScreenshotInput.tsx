import { useCallback, useRef, useState, useEffect } from 'react'
import { Image, Upload, Camera, X, Clipboard } from 'lucide-react'

interface ScreenshotInputProps {
  screenshot: string | null
  onScreenshotChange: (screenshot: string | null) => void
  disabled?: boolean
}

export function ScreenshotInput({ screenshot, onScreenshotChange, disabled }: ScreenshotInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled) return

      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            processFile(file)
          }
          break
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [disabled])

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      onScreenshotChange(dataUrl)
    }
    reader.readAsDataURL(file)
  }, [onScreenshotChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled) return

    const file = e.dataTransfer.files[0]
    if (file) {
      processFile(file)
    }
  }, [disabled, processFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }, [processFile])

  const handleCapture = useCallback(async () => {
    if (disabled || isCapturing) return

    setIsCapturing(true)
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'window' } as MediaTrackConstraints,
        audio: false,
      })

      // Use video element approach for better compatibility
      const video = document.createElement('video')
      video.srcObject = stream
      video.autoplay = true

      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play()
          resolve()
        }
      })

      // Small delay to ensure frame is ready
      await new Promise(resolve => setTimeout(resolve, 100))

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0)

      const dataUrl = canvas.toDataURL('image/png')
      onScreenshotChange(dataUrl)

      stream.getTracks().forEach(t => t.stop())
    } catch (err) {
      // User cancelled or error
      console.log('Screen capture cancelled or failed:', err)
    } finally {
      setIsCapturing(false)
    }
  }, [disabled, isCapturing, onScreenshotChange])

  const handleReadClipboard = useCallback(async () => {
    if (disabled) return

    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        const imageType = item.types.find(type => type.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          const reader = new FileReader()
          reader.onload = (e) => {
            onScreenshotChange(e.target?.result as string)
          }
          reader.readAsDataURL(blob)
          break
        }
      }
    } catch {
      // Clipboard access denied or no image
      alert('No image found in clipboard. Try copying a screenshot first!')
    }
  }, [disabled, onScreenshotChange])

  if (screenshot) {
    return (
      <div className="glass rounded-2xl p-4 animate-in">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Image className="w-4 h-4" />
            <span>Context Screenshot</span>
          </div>
          <button
            onClick={() => onScreenshotChange(null)}
            disabled={disabled}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="relative rounded-xl overflow-hidden bg-slate-800/50 max-h-64">
          <img
            src={screenshot}
            alt="Screenshot context"
            className="w-full h-full object-contain max-h-64"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          glass rounded-2xl p-8 border-2 border-dashed transition-all duration-200
          ${isDragging
            ? 'border-primary-500 bg-primary-500/10'
            : 'border-slate-600 hover:border-slate-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center">
            <Image className="w-8 h-8 text-slate-400" />
          </div>

          <div className="text-center">
            <p className="text-slate-300 font-medium">
              Add context screenshot <span className="text-slate-500">(optional)</span>
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Paste (Cmd+V) • Drop image • Upload • Capture
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={handleReadClipboard}
              disabled={disabled}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Clipboard className="w-4 h-4" />
              Paste
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
            <button
              onClick={handleCapture}
              disabled={disabled || isCapturing}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Camera className="w-4 h-4" />
              {isCapturing ? 'Capturing...' : 'Capture'}
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
