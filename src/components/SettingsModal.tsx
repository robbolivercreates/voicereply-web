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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in">
      <div className="bg-[#f0f0f0] rounded-sm w-full max-w-md shadow-2xl border-4 border-[#dcd8cc] relative overflow-hidden">

        {/* Header - Service Manual Style */}
        <div className="bg-[#2a2a2a] px-6 py-4 flex justify-between items-center border-b-4 border-[#d4af37]">
          <div className="flex flex-col">
            <span className="text-[#d4af37] font-bold tracking-[0.2em] text-xs uppercase">System Configuration</span>
            <h2 className="text-white font-serif text-xl tracking-wide">SETTINGS</h2>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8 relative">

          {/* Section 1: API */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">
              <Key className="w-3 h-3 inline mr-1" /> Access Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="ENTER API KEY"
              className="w-full bg-[#e8e4d9] border-b-2 border-stone-400 p-2 font-mono text-stone-800 focus:outline-none focus:border-stone-800 focus:bg-[#dcd8cc] transition-colors placeholder:text-stone-400/50"
            />
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-stone-400 mt-1 block hover:text-stone-600 hover:underline text-right">GET KEY →</a>
          </div>

          {/* Section 2: Language (Radio Buttons) */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-3">
              <Globe className="w-3 h-3 inline mr-1" /> Output Language
            </label>
            <div className="flex gap-4">
              {[
                { id: 'en', label: 'ENG' },
                { id: 'pt', label: 'POR' },
                { id: 'es', label: 'ESP' },
              ].map((lang) => (
                <label key={lang.id} className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border-2 border-stone-400 flex items-center justify-center ${language === lang.id ? 'border-stone-800' : ''}`}>
                    {language === lang.id && <div className="w-2 h-2 rounded-full bg-stone-800" />}
                  </div>
                  <input type="radio" className="hidden" checked={language === lang.id} onChange={() => setLanguage(lang.id as OutputLanguage)} />
                  <span className={`text-xs font-bold ${language === lang.id ? 'text-stone-800' : 'text-stone-400 group-hover:text-stone-600'}`}>{lang.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 3: Toggles (Simulated Mechanical Switches) */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-stone-300">

            {/* Clarify Toggle */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Clarify
              </label>
              <button
                onClick={() => setClarifyText(!clarifyText)}
                className={`w-12 h-6 rounded-full relative transition-colors duration-200 border-2 ${clarifyText ? 'bg-stone-700 border-stone-800' : 'bg-stone-300 border-stone-400'}`}
              >
                <div className={`absolute top-0.5 bottom-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ${clarifyText ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
              </button>
            </div>

            {/* Sound Toggle */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> Audio FX
              </label>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-12 h-6 rounded-full relative transition-colors duration-200 border-2 ${soundEnabled ? 'bg-stone-700 border-stone-800' : 'bg-stone-300 border-stone-400'}`}
              >
                <div className={`absolute top-0.5 bottom-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ${soundEnabled ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
              </button>
            </div>

          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6">
            <button onClick={onClose} className="text-stone-500 text-xs font-bold uppercase tracking-wider hover:text-stone-800">Cancel</button>
            <button
              onClick={handleSave}
              className="bg-[#2a2a2a] text-white px-6 py-2 rounded-sm text-xs font-bold uppercase tracking-widest shadow-md active:translate-y-px hover:bg-black transition-colors"
            >
              Save Config
            </button>
          </div>

          {/* Watermark/Texture */}
          <div className="absolute bottom-2 left-4 text-[8px] text-stone-300 font-mono pointer-events-none">MANUAL REF: 8492-B</div>

        </div>
      </div>
    </div>
  )
}
