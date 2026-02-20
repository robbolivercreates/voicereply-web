import { useRef, useCallback } from 'react'
import { Mic, Square } from 'lucide-react'
import { playClickSound } from '../lib/sounds'
import type { RecordingState } from '../types'

interface VoiceRecorderProps {
  state: RecordingState
  onStateChange: (state: RecordingState) => void
  onRecordingComplete: (blob: Blob) => void
}

export function VoiceRecorder({ state, onStateChange, onRecordingComplete }: VoiceRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })

      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        stream.getTracks().forEach(track => track.stop())
        if (blob.size > 0) onRecordingComplete(blob)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(100)
      onStateChange('recording')
    } catch (err) {
      console.error('Failed to start recording:', err)
      alert('Could not access microphone.')
    }
  }, [onRecordingComplete, onStateChange])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const handleToggleRecord = useCallback(() => {
    playClickSound()
    if (state === 'idle') {
      startRecording()
    } else if (state === 'recording') {
      stopRecording()
    }
  }, [state, startRecording, stopRecording])

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Large Tactile Record Button */}
      <button
        onClick={handleToggleRecord}
        disabled={state === 'processing'}
        className={`
          size-28 md:size-32 rounded-full relative flex items-center justify-center group 
          shadow-button active:shadow-button-active transition-all duration-150 ease-out
          border border-[#333] bg-gradient-to-br from-[#2a2a2a] to-[#151515]
          ${state === 'processing' ? 'opacity-50 grayscale cursor-wait' : ''}
        `}
      >
        {/* Outer glowing rings when recording (Modern element) */}
        <div className={`absolute -inset-2 rounded-full border border-accent/40 transition-all duration-500 ease-out ${state === 'recording' ? 'scale-105 opacity-100 animate-pulse' : 'scale-95 opacity-0'}`} />
        <div className={`absolute -inset-4 rounded-full border border-accent/20 transition-all duration-700 ease-out delay-75 ${state === 'recording' ? 'scale-110 opacity-100 animate-ping' : 'scale-90 opacity-0'}`} />

        {/* Vintage metallic inner recess */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-b from-[#111] to-[#1a1a1a] shadow-mechanical-inset pointer-events-none" />

        {/* Subtle accent inner border */}
        <div className={`absolute inset-2 rounded-full border transition-colors duration-300 pointer-events-none ${state === 'recording' ? 'border-accent/50' : 'border-white/5 group-hover:border-accent/20'}`} />

        {/* Icon */}
        <div className={`relative z-10 transition-all duration-300 ${state === 'recording' ? 'text-accent scale-110 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]' : 'text-text-muted group-hover:text-accent group-hover:scale-105 group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`}>
          {state === 'recording' ? (
            <Square className="w-10 h-10 fill-current" />
          ) : (
            <Mic className="w-12 h-12 stroke-[1.5]" />
          )}
        </div>
      </button>

      {/* Elegant Status Label */}
      <div className="h-4 flex items-center justify-center mt-2">
        {state === 'recording' ? (
          <span className="text-[10px] font-mono tracking-[0.3em] text-accent font-bold uppercase animate-pulse drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]">
            RECORDING
          </span>
        ) : state === 'processing' ? (
          <span className="text-[10px] font-mono tracking-[0.3em] text-text-muted uppercase animate-pulse">
            PROCESSING...
          </span>
        ) : (
          <span className="text-[10px] font-mono tracking-[0.3em] text-text-muted/50 uppercase transition-opacity group-hover:opacity-100">
            READY TO RECORD
          </span>
        )}
      </div>
    </div>
  )
}
