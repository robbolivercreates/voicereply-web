import { useState, useCallback, useEffect } from 'react'
import { Settings, History, Sparkles } from 'lucide-react'
import { VoiceRecorder } from './components/VoiceRecorder'
import { StyleSelector } from './components/StyleSelector'
import { CommandInput } from './components/CommandInput'
import { ResponseDisplay } from './components/ResponseDisplay'
import { Toast } from './components/Toast'
import { SettingsModal } from './components/SettingsModal'
import { HistoryModal } from './components/HistoryModal'
import { SocialModePanel } from './components/SocialModePanel'
import { generateResponse } from './lib/api'
import { playStartSound, playStopSound, playSuccessSound, playErrorSound } from './lib/sounds'
import type { TranscriptionMode, OutputLanguage, RecordingState, HistoryItem, ReplyStyle } from './types'

function App() {
  const [mode, setMode] = useState<TranscriptionMode>('text')
  const [commandText, setCommandText] = useState('')
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])

  // Social mode state
  const [socialScreenshot, setSocialScreenshot] = useState<string | null>(null)
  const [replyStyle, setReplyStyle] = useState<ReplyStyle>('friendly')

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('vibeflow-history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('vibeflow-history', JSON.stringify(history.slice(0, 50)))
  }, [history])

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Handle recording state changes with sound
  const handleRecordingStateChange = useCallback((newState: RecordingState) => {
    if (newState === 'recording' && recordingState === 'idle') {
      playStartSound()
    } else if (newState === 'processing' && recordingState === 'recording') {
      playStopSound()
    }
    setRecordingState(newState)
  }, [recordingState])

  const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
    setRecordingState('processing')
    setError(null)
    setResult(null)

    try {
      // Convert audio to base64
      const audioBase64 = await blobToBase64(audioBlob)

      // Get settings
      const outputLanguage = (localStorage.getItem('vibeflow-language') as OutputLanguage) || 'en'
      const clarifyText = localStorage.getItem('vibeflow-clarify') === 'true'

      // Build selected text based on mode
      let selectedText: string | undefined
      if (mode === 'command') {
        selectedText = commandText
      } else if (mode === 'social' && socialScreenshot) {
        // For social mode, pass screenshot and style info
        selectedText = `[SCREENSHOT_BASE64]${socialScreenshot}[/SCREENSHOT_BASE64]\n[REPLY_STYLE]${replyStyle}[/REPLY_STYLE]`
      }

      const response = await generateResponse({
        audio: audioBase64,
        mode,
        selectedText,
        outputLanguage,
        clarifyText,
        // Pass screenshot directly for social mode
        screenshot: mode === 'social' ? socialScreenshot || undefined : undefined,
        replyStyle: mode === 'social' ? replyStyle : undefined,
      })

      if (response.success && response.result) {
        setResult(response.result)
        playSuccessSound()

        // Auto-copy to clipboard
        try {
          await navigator.clipboard.writeText(response.result)
          showToast('Copied to clipboard!')
        } catch {
          // Clipboard access denied, user can manually copy
          showToast('Reply generated!')
        }

        // Add to history
        const historyItem: HistoryItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          result: response.result,
          mode,
        }
        setHistory(prev => [historyItem, ...prev])

        // Clear inputs after successful operation
        if (mode === 'command') {
          setCommandText('')
        }
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
  }, [mode, commandText, socialScreenshot, replyStyle, showToast])

  const handleCopy = useCallback(async () => {
    if (result) {
      try {
        await navigator.clipboard.writeText(result)
        showToast('Copied to clipboard!')
      } catch {
        showToast('Failed to copy', 'error')
      }
    }
  }, [result, showToast])

  const handleClear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  const loadFromHistory = useCallback((item: HistoryItem) => {
    setResult(item.result)
    setMode(item.mode)
    setShowHistory(false)
  }, [])

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      {/* Header */}
      <header className="glass border-b border-white/5 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg glow-primary">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gradient">VibeFlow</h1>
            <p className="text-xs text-white/40">Voice to Text AI</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHistory(true)}
            className="p-2.5 rounded-xl hover:bg-white/5 transition-all duration-300 group"
            title="History"
          >
            <History className="w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 rounded-xl hover:bg-white/5 transition-all duration-300 group"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full space-y-8 relative z-10">
        {/* Mode Selector */}
        <div className="animate-in" style={{ animationDelay: '0.1s' }}>
          <StyleSelector
            selected={mode}
            onSelect={setMode}
            disabled={recordingState !== 'idle'}
          />
        </div>

        {/* Command Mode Text Input */}
        {mode === 'command' && (
          <div className="animate-in" style={{ animationDelay: '0.15s' }}>
            <CommandInput
              value={commandText}
              onChange={setCommandText}
              disabled={recordingState !== 'idle'}
            />
          </div>
        )}

        {/* Social Mode Panel */}
        {mode === 'social' && (
          <div className="animate-in" style={{ animationDelay: '0.15s' }}>
            <SocialModePanel
              screenshot={socialScreenshot}
              onScreenshotChange={setSocialScreenshot}
              replyStyle={replyStyle}
              onReplyStyleChange={setReplyStyle}
              disabled={recordingState !== 'idle'}
            />
          </div>
        )}

        {/* Voice Recorder */}
        <div className="animate-in" style={{ animationDelay: '0.2s' }}>
          <VoiceRecorder
            state={recordingState}
            onStateChange={handleRecordingStateChange}
            onRecordingComplete={handleRecordingComplete}
          />
        </div>

        {/* Result Display */}
        {(result || error || recordingState === 'processing') && (
          <div className="animate-in">
            <ResponseDisplay
              response={result}
              transcription={null}
              error={error}
              isLoading={recordingState === 'processing'}
              onCopy={handleCopy}
              onClear={handleClear}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="glass border-t border-white/5 px-4 py-4 text-center relative z-10">
        <p className="text-sm text-white/30">
          Powered by{' '}
          <a
            href="https://ai.google.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white/70 transition-colors"
          >
            Gemini AI
          </a>
        </p>
      </footer>

      {/* Modals */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
      {showHistory && (
        <HistoryModal
          history={history}
          onClose={() => setShowHistory(false)}
          onSelect={loadFromHistory}
          onClear={() => {
            setHistory([])
            showToast('History cleared')
          }}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      // Remove the data URL prefix to get just the base64
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default App
