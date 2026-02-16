import { useRef, useEffect, useCallback, useState } from 'react'
import { Mic, Loader2 } from 'lucide-react'
import type { RecordingState } from '../types'

interface VoiceRecorderProps {
  state: RecordingState
  onStateChange: (state: RecordingState) => void
  onRecordingComplete: (blob: Blob) => void
}

export function VoiceRecorder({ state, onStateChange, onRecordingComplete }: VoiceRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [audioLevel, setAudioLevel] = useState(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isHoldingRef = useRef(false)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      })

      // Set up audio analysis for visualization
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      // Start level monitoring
      const updateLevel = () => {
        if (analyserRef.current && isHoldingRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(average / 255)
          animationFrameRef.current = requestAnimationFrame(updateLevel)
        }
      }
      updateLevel()

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })

      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        stream.getTracks().forEach(track => track.stop())
        audioContext.close()

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        setAudioLevel(0)

        if (blob.size > 0) {
          onRecordingComplete(blob)
        }
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(100) // Collect data every 100ms
      onStateChange('recording')
    } catch (err) {
      console.error('Failed to start recording:', err)
      alert('Could not access microphone. Please allow microphone access and try again.')
    }
  }, [onRecordingComplete, onStateChange])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      isHoldingRef.current = false
    }
  }, [])

  const handlePointerDown = useCallback(() => {
    if (state === 'idle') {
      isHoldingRef.current = true
      startRecording()
    }
  }, [state, startRecording])

  const handlePointerUp = useCallback(() => {
    if (state === 'recording') {
      stopRecording()
    }
  }, [state, stopRecording])

  // Keyboard support (Space to record)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && state === 'idle' && !e.repeat) {
        e.preventDefault()
        isHoldingRef.current = true
        startRecording()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && state === 'recording') {
        e.preventDefault()
        stopRecording()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [state, startRecording, stopRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <div className="card-premium rounded-3xl p-8">
      <div className="flex flex-col items-center gap-6">
        {/* Main Record Button */}
        <div className="relative">
          {/* Outer glow ring when recording */}
          {state === 'recording' && (
            <>
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{
                  background: 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)',
                  transform: 'scale(1.5)',
                }}
              />
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%)',
                  transform: 'scale(2)',
                }}
              />
            </>
          )}

          <button
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            disabled={state === 'processing'}
            className={`
              relative w-32 h-32 rounded-full flex items-center justify-center
              transition-all duration-300 ease-out select-none touch-none
              ${state === 'recording'
                ? 'bg-gradient-to-br from-red-500 to-rose-600 recording-pulse recording-glow scale-105'
                : state === 'processing'
                  ? 'bg-white/10 cursor-not-allowed'
                  : 'bg-gradient-to-br from-primary-500 to-purple-600 hover:scale-105 active:scale-95 glow-primary'
              }
            `}
            style={{
              boxShadow: state === 'recording'
                ? `0 0 ${40 + audioLevel * 60}px ${15 + audioLevel * 25}px rgba(239, 68, 68, ${0.3 + audioLevel * 0.4})`
                : state === 'idle'
                  ? '0 10px 40px -10px rgba(99, 102, 241, 0.5)'
                  : undefined
            }}
          >
            {state === 'processing' ? (
              <Loader2 className="w-12 h-12 text-white/80 animate-spin" />
            ) : (
              <Mic
                className={`w-12 h-12 text-white transition-transform duration-300 ${
                  state === 'recording' ? 'scale-110' : ''
                }`}
              />
            )}
          </button>
        </div>

        {/* Audio Level Visualizer */}
        <div className={`flex items-center justify-center gap-1.5 h-10 transition-opacity duration-300 ${
          state === 'recording' ? 'opacity-100' : 'opacity-0'
        }`}>
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="waveform-bar"
              style={{
                width: '4px',
                height: state === 'recording'
                  ? `${Math.max(8, Math.min(40, 8 + audioLevel * 60 * (0.5 + Math.random() * 0.5)))}px`
                  : '8px',
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}
        </div>

        {/* Instructions */}
        <div className="text-center space-y-1">
          {state === 'recording' ? (
            <p className="text-lg font-medium text-red-400 animate-pulse">
              Release to send
            </p>
          ) : state === 'processing' ? (
            <p className="text-lg font-medium text-white/60">
              Generating response...
            </p>
          ) : (
            <>
              <p className="text-lg font-medium text-white/80">
                Hold to speak
              </p>
              <p className="text-sm text-white/40">
                or press <kbd className="px-2 py-0.5 rounded bg-white/10 text-white/60 text-xs font-mono">Space</kbd>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
