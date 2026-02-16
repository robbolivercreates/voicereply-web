import { X, Key, Volume2, Globe, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { OutputLanguage } from '../types'

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState('')
  const [language, setLanguage] = useState<OutputLanguage>('en')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [clarifyText, setClarifyText] = useState(false)

  useEffect(() => {
    setApiKey(localStorage.getItem('vibeflow-apikey') || '')
    setLanguage((localStorage.getItem('vibeflow-language') as OutputLanguage) || 'en')
    setSoundEnabled(localStorage.getItem('vibeflow-sound') !== 'false')
    setClarifyText(localStorage.getItem('vibeflow-clarify') === 'true')
  }, [])

  const handleSave = () => {
    localStorage.setItem('vibeflow-apikey', apiKey)
    localStorage.setItem('vibeflow-language', language)
    localStorage.setItem('vibeflow-sound', soundEnabled ? 'true' : 'false')
    localStorage.setItem('vibeflow-clarify', clarifyText ? 'true' : 'false')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in">
      <div className="glass rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* API Key */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Key className="w-4 h-4" />
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="input-base w-full"
            />
            <p className="text-xs text-slate-500 mt-2">
              Get your API key from{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          {/* Output Language */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Globe className="w-4 h-4" />
              Output Language
            </label>
            <div className="flex gap-2">
              {[
                { id: 'en' as OutputLanguage, label: 'English', flag: '🇺🇸' },
                { id: 'pt' as OutputLanguage, label: 'Português', flag: '🇧🇷' },
                { id: 'es' as OutputLanguage, label: 'Español', flag: '🇪🇸' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    language === lang.id
                      ? 'bg-primary-500 text-white'
                      : 'glass text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span className="hidden sm:inline">{lang.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              The output will always be in this language, regardless of what you speak
            </p>
          </div>

          {/* Clarify Text */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Sparkles className="w-4 h-4" />
              Clarify Text
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setClarifyText(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  clarifyText
                    ? 'bg-primary-500 text-white'
                    : 'glass text-slate-400'
                }`}
              >
                On
              </button>
              <button
                onClick={() => setClarifyText(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !clarifyText
                    ? 'bg-primary-500 text-white'
                    : 'glass text-slate-400'
                }`}
              >
                Off
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              When enabled, reorganizes confusing speech into clear, structured text
            </p>
          </div>

          {/* Sound Effects */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Volume2 className="w-4 h-4" />
              Sound Effects
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSoundEnabled(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  soundEnabled
                    ? 'bg-primary-500 text-white'
                    : 'glass text-slate-400'
                }`}
              >
                On
              </button>
              <button
                onClick={() => setSoundEnabled(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !soundEnabled
                    ? 'bg-primary-500 text-white'
                    : 'glass text-slate-400'
                }`}
              >
                Off
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
