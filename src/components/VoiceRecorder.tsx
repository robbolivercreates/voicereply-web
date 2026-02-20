import { useRef, useCallback, useState } from 'react'
import { Mic } from 'lucide-react'
import { playStartSound, playStopSound } from '../lib/sounds'
import type { RecordingState } from '../types'

interface VoiceRecorderProps {
  state: RecordingState
  onStateChange: (state: RecordingState) => void
  onRecordingComplete: (blob: Blob) => void
}

export function VoiceRecorder({ state, onStateChange, onRecordingComplete }: VoiceRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [isReady, setIsReady] = useState(false) // true = signal given, speak now

  // ── Push-to-talk: hold starts, release stops ──────────────────────────────
  const handlePointerDown = useCallback(async (e: React.PointerEvent) => {
    e.preventDefault()
    if (state !== 'idle') return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      })

      chunksRef.current = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        stream.getTracks().forEach((t) => t.stop())
        setIsReady(false)
        if (blob.size > 0) onRecordingComplete(blob)
      }

      mediaRecorderRef.current = mediaRecorder

      // Brief warm-up signal: show READY state for 300ms, then start recording
      onStateChange('recording')
      setIsReady(false)
      playStartSound()

      setTimeout(() => {
        setIsReady(true)        // signal: "speak now"
        mediaRecorder.start(100)
      }, 300)
    } catch {
      alert('Could not access microphone.')
    }
  }, [state, onStateChange, onRecordingComplete])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    if (state !== 'recording') return
    if (mediaRecorderRef.current?.state === 'recording') {
      playStopSound()
      mediaRecorderRef.current.stop()
      onStateChange('processing')
    }
  }, [state, onStateChange])

  const isRecording = state === 'recording'
  const isProcessing = state === 'processing'

  return (
    <div className="relative flex flex-col items-center gap-4 select-none">
      {/* Large tactile push-to-talk button */}
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}  // release if finger slides off
        disabled={isProcessing}
        className={`
          size-28 md:size-32 rounded-full relative flex items-center justify-center
          shadow-button transition-all duration-150 ease-out
          border bg-gradient-to-br touch-none
          ${isRecording
            ? 'border-accent/60 from-[#2a1a00] to-[#1a1000] scale-95 shadow-button-active'
            : 'border-[#333] from-[#2a2a2a] to-[#151515] active:scale-95'
          }
          ${isProcessing ? 'opacity-50 grayscale cursor-wait' : 'cursor-pointer'}
        `}
      >
        {/* Outer glowing rings when recording */}
        <div className={`absolute -inset-2 rounded-full border border-accent/40 transition-all duration-500
          ${isRecording ? 'scale-105 opacity-100 animate-pulse' : 'scale-95 opacity-0'}`} />
        <div className={`absolute -inset-4 rounded-full border border-accent/20 transition-all duration-700 delay-75
          ${isRecording && isReady ? 'scale-110 opacity-100 animate-ping' : 'scale-90 opacity-0'}`} />

        {/* Vintage metallic inner recess */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-b from-[#111] to-[#1a1a1a] shadow-mechanical-inset pointer-events-none" />

        {/* Inner border */}
        <div className={`absolute inset-2 rounded-full border transition-colors duration-300 pointer-events-none
          ${isRecording ? 'border-accent/50' : 'border-white/5'}`} />

        {/* Icon */}
        <div className={`relative z-10 transition-all duration-300
          ${isRecording
            ? 'text-accent scale-110 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]'
            : 'text-text-muted'
          }`}>
          <Mic className="w-12 h-12 stroke-[1.5]" />
        </div>
      </button>

      {/* Elegant status label */}
      <div className="h-5 flex items-center justify-center mt-1">
        {isProcessing ? (
          <span className="text-[10px] font-mono tracking-[0.3em] text-text-muted uppercase animate-pulse">
            PROCESSING...
          </span>
        ) : isRecording && isReady ? (
          <span className="text-[10px] font-mono tracking-[0.35em] text-accent font-bold uppercase flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
            SPEAK NOW
          </span>
        ) : isRecording ? (
          <span className="text-[10px] font-mono tracking-[0.3em] text-accent/60 uppercase animate-pulse">
            HOLD TO RECORD...
          </span>
        ) : (
          <span className="text-[10px] font-mono tracking-[0.3em] text-text-muted/40 uppercase">
            HOLD TO SPEAK
          </span>
        )}
      </div>
    </div>
  )
}
