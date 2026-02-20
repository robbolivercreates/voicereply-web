
import { useState, useCallback, useEffect } from 'react'
import { Settings, List } from 'lucide-react'
import { VoiceRecorder } from './components/VoiceRecorder'
import { ModeSelector } from './components/ModeSelector'
import { ResponseDisplay } from './components/ResponseDisplay'
import { SocialModePanel } from './components/SocialModePanel'
import { TranslationPanel } from './components/TranslationPanel'
import { Toast } from './components/Toast'
import { SettingsModal } from './components/SettingsModal'
import { HistoryModal } from './components/HistoryModal'
import { generateResponse } from './lib/api'
import { playStartSound, playStopSound, playSuccessSound, playErrorSound, playClickSound } from './lib/sounds'
import type { TranscriptionMode, OutputLanguage, RecordingState, HistoryItem, ReplyStyle } from './types'

function App() {
  const [mode, setMode] = useState<TranscriptionMode>('text')
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  // accumulate last 4 messages
  const [messages, setMessages] = useState<Array<{ result: string; transcription: string | null }>>([])
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [replyStyle, setReplyStyle] = useState<ReplyStyle>('friendly')

  useEffect(() => {
    const saved = localStorage.getItem('vibeflow-history')
    if (saved) {
      try { setHistory(JSON.parse(saved)) } catch { /* */ }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('vibeflow-history', JSON.stringify(history.slice(0, 50)))
  }, [history])

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    localStorage.removeItem('vibeflow-history')
    showToast('History cleared')
  }, [showToast])

  const handleRecordingStateChange = useCallback((newState: RecordingState) => {
    if (newState === 'recording' && recordingState === 'idle') playStartSound()
    else if (newState === 'processing' && recordingState === 'recording') playStopSound()
    setRecordingState(newState)
  }, [recordingState])

  const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
    setRecordingState('processing')
    setError(null)

    try {
      const audioBase64 = await blobToBase64(audioBlob)
      const outputLanguage = (localStorage.getItem('vibeflow-language') as OutputLanguage) || 'en'
      const clarifyText = localStorage.getItem('vibeflow-clarify') === 'true'

      const response = await generateResponse({
        audio: audioBase64,
        mode,
        outputLanguage,
        clarifyText,
        screenshot: mode === 'social' ? screenshot || undefined : undefined,
        replyStyle: mode === 'social' ? replyStyle : undefined,
      })

      if (response.success && response.result) {
        // Add to messages array, keep last 4
        setMessages((prev) => [
          ...prev.slice(-3),
          { result: response.result!, transcription: response.transcription ?? null },
        ])
        playSuccessSound()
        showToast('Reply generated! Tap message to copy.')

        setHistory((prev: HistoryItem[]) => [{
          id: Date.now().toString(),
          timestamp: Date.now(),
          result: response.result!,
          mode,
        }, ...prev])
      } else {
        setError(response.error || 'Failed to generate response')
        playErrorSound()
        showToast(response.error || 'Failed to generate response', 'error')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      playErrorSound()
      showToast(message, 'error')
    } finally {
      setRecordingState('idle')
    }
  }, [mode, screenshot, replyStyle, showToast])

  const handleCopy = useCallback(async () => {
    const last = messages[messages.length - 1]
    if (last?.result) {
      try {
        await navigator.clipboard.writeText(last.result)
        showToast('Copied!')
      } catch {
        showToast('Failed to copy', 'error')
      }
    }
  }, [messages, showToast])

  const loadFromHistory = useCallback((item: HistoryItem) => {
    setMessages([{ result: item.result, transcription: null }])
    setMode(item.mode)
    setShowHistory(false)
  }, [])

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-body overflow-hidden relative">

      {/* ── TOP: TEXT DISPLAY AREA ── */}
      <div className="flex-1 w-full flex flex-col p-4 md:p-6 overflow-hidden z-10 pt-10">
        <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col overflow-hidden relative">

          {/* Enclosure / Screen background */}
          <div className="absolute inset-0 bg-screen rounded-[2rem] shadow-mechanical-inset border border-white/5 pointer-events-none" />

          <div className="relative z-10 flex-1 flex flex-col p-5 md:p-7 overflow-y-auto scrollbar-hide">
            {mode === 'social' ? (
              <SocialModePanel
                screenshot={screenshot}
                onScreenshotChange={setScreenshot}
                replyStyle={replyStyle}
                onReplyStyleChange={setReplyStyle}
                disabled={recordingState !== 'idle'}
                result={messages[messages.length - 1]?.result ?? null}
                transcription={messages[messages.length - 1]?.transcription ?? null}
                isLoading={recordingState === 'processing'}
                onCopy={handleCopy}
              />
            ) : mode === 'translate' ? (
              <TranslationPanel
                apiKey={localStorage.getItem('vibeflow-apikey')}
              />
            ) : (
              <ResponseDisplay
                messages={messages}
                mode={mode}
                error={error}
                isLoading={recordingState === 'processing'}
                onCopy={handleCopy}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── CENTER: PROMINENT BUTTON ── */}
      <div className="flex-shrink-0 flex items-center justify-center py-4 md:py-8 z-20">
        <VoiceRecorder
          state={recordingState}
          onStateChange={handleRecordingStateChange}
          onRecordingComplete={handleRecordingComplete}
        />
      </div>

      {/* ── BOTTOM: MINIMALIST SECONDARY CONTROLS ── */}
      <div className="w-full pb-8 pt-2 px-6 flex flex-col items-center z-10">
        <div className="flex w-full max-w-md justify-between items-center opacity-60 hover:opacity-100 transition-opacity duration-500">

          <button
            onClick={() => { playClickSound(); setShowHistory(true) }}
            className="group flex flex-col items-center gap-1.5 p-2 active:scale-95 transition-transform"
          >
            <List className="w-5 h-5 text-text-muted group-hover:text-text-main transition-colors" />
            <span className="text-[9px] font-sans font-bold tracking-widest text-text-muted group-hover:text-text-main uppercase">Logs</span>
          </button>

          <ModeSelector
            selected={mode}
            onSelect={setMode}
            disabled={recordingState !== 'idle'}
          />

          <button
            onClick={() => { playClickSound(); setShowSettings(true) }}
            className="group flex flex-col items-center gap-1.5 p-2 active:scale-95 transition-transform"
          >
            <Settings className="w-5 h-5 text-text-muted group-hover:text-text-main transition-colors" />
            <span className="text-[9px] font-sans font-bold tracking-widest text-text-muted group-hover:text-text-main uppercase">System</span>
          </button>

        </div>
      </div>

      {/* Modals */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {showHistory && (
        <HistoryModal
          history={history}
          onClose={() => setShowHistory(false)}
          onSelect={loadFromHistory}
          onClear={clearHistory}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default App
