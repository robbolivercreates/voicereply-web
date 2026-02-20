import { useState, useCallback, useRef } from 'react'
import { Copy, Check, Mic, Square, Globe } from 'lucide-react'
import { translateText, translateAudio } from '../lib/api'
import { playClickSound, playStartSound, playStopSound, playSuccessSound, playErrorSound } from '../lib/sounds'

const LANGUAGES = [
    { code: 'English', label: '🇺🇸 English' },
    { code: 'Portuguese', label: '🇧🇷 Portuguese' },
    { code: 'Spanish', label: '🇪🇸 Spanish' },
    { code: 'French', label: '🇫🇷 French' },
    { code: 'German', label: '🇩🇪 German' },
    { code: 'Italian', label: '🇮🇹 Italian' },
    { code: 'Japanese', label: '🇯🇵 Japanese' },
    { code: 'Chinese (Simplified)', label: '🇨🇳 Chinese' },
    { code: 'Korean', label: '🇰🇷 Korean' },
    { code: 'Arabic', label: '🇸🇦 Arabic' },
    { code: 'Russian', label: '🇷🇺 Russian' },
    { code: 'Dutch', label: '🇳🇱 Dutch' },
]

interface TranslationPanelProps {
    apiKey: string | null
}

type Phase = 'input' | 'translating' | 'translated' | 'recording' | 'translating-reply' | 'done'

export function TranslationPanel({ apiKey }: TranslationPanelProps) {
    const [phase, setPhase] = useState<Phase>('input')
    const [sourceText, setSourceText] = useState('')
    const [targetLanguage, setTargetLanguage] = useState('English')
    const [translation, setTranslation] = useState('')
    const [detectedLang, setDetectedLang] = useState('')
    const [replyTranslation, setReplyTranslation] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState<'translation' | 'reply' | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])

    const handleTranslate = useCallback(async () => {
        if (!sourceText.trim()) return
        if (!apiKey) { setError('No API key — open Settings to add one.'); return }
        setError(null)
        setPhase('translating')
        playClickSound()

        try {
            const result = await translateText(sourceText.trim(), targetLanguage, apiKey)
            setTranslation(result.translation)
            setDetectedLang(result.fromLanguageName)
            setPhase('translated')
            playSuccessSound()
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Translation failed')
            setPhase('input')
            playErrorSound()
        }
    }, [sourceText, targetLanguage, apiKey])

    const handleStartRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } })
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
            })
            chunksRef.current = []
            mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop())
                const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
                if (!blob.size) return
                setPhase('translating-reply')
                playStopSound()

                try {
                    const base64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader()
                        reader.onloadend = () => resolve((reader.result as string).split(',')[1])
                        reader.onerror = reject
                        reader.readAsDataURL(blob)
                    })
                    const translated = await translateAudio(base64, detectedLang, apiKey!)
                    setReplyTranslation(translated)
                    setPhase('done')
                    playSuccessSound()
                } catch (e) {
                    setError(e instanceof Error ? e.message : 'Reply translation failed')
                    setPhase('translated')
                    playErrorSound()
                }
            }
            mediaRecorderRef.current = mediaRecorder
            mediaRecorder.start(100)
            setPhase('recording')
            playStartSound()
        } catch {
            setError('Could not access microphone')
        }
    }, [detectedLang, apiKey])

    const handleStopRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop()
        }
    }, [])

    const handleCopy = useCallback(async (type: 'translation' | 'reply') => {
        const text = type === 'translation' ? translation : replyTranslation
        await navigator.clipboard.writeText(text).catch(() => { })
        setCopied(type)
        setTimeout(() => setCopied(null), 2000)
    }, [translation, replyTranslation])

    const handleReset = useCallback(() => {
        setPhase('input')
        setSourceText('')
        setTranslation('')
        setDetectedLang('')
        setReplyTranslation('')
        setError(null)
        playClickSound()
    }, [])

    return (
        <div className="flex flex-col gap-4 w-full h-full overflow-y-auto scrollbar-hide">

            {/* Error */}
            {error && (
                <div className="text-[11px] font-mono text-red-400 bg-red-950/20 border border-red-900/50 rounded-xl px-4 py-3">
                    [SYS_ERR]: {error}
                </div>
            )}

            {/* Phase: Input */}
            {(phase === 'input' || phase === 'translating') && (
                <div className="flex flex-col gap-3">
                    {/* Source text */}
                    <div className="relative">
                        <textarea
                            value={sourceText}
                            onChange={e => setSourceText(e.target.value)}
                            placeholder="Paste or type text to translate..."
                            rows={4}
                            className="w-full text-[13px] font-mono text-text-main bg-white/[0.04] border border-divider rounded-2xl px-4 py-3 resize-none focus:outline-none focus:border-accent/40 focus:shadow-[0_0_12px_rgba(245,158,11,0.1)] placeholder:text-text-muted/30 transition-all duration-300 shadow-mechanical-inset"
                        />
                    </div>

                    {/* Target language */}
                    <div className="flex items-center gap-3 px-1">
                        <Globe className="w-4 h-4 text-text-muted/60 flex-shrink-0" />
                        <span className="text-[9px] font-mono tracking-[0.25em] text-text-muted/50 uppercase flex-shrink-0">Into</span>
                        <select
                            value={targetLanguage}
                            onChange={e => setTargetLanguage(e.target.value)}
                            className="flex-1 text-[12px] font-mono bg-white/[0.04] border border-divider rounded-xl px-3 py-2 focus:outline-none focus:border-accent/40 text-text-main appearance-none cursor-pointer shadow-mechanical-inset transition-all duration-300"
                        >
                            {LANGUAGES.map(l => <option key={l.code} value={l.code} className="bg-[#161616]">{l.label}</option>)}
                        </select>
                    </div>

                    {/* Translate button */}
                    <button
                        onClick={handleTranslate}
                        disabled={!sourceText.trim() || phase === 'translating'}
                        className="w-full py-3 rounded-2xl border border-accent/30 bg-accent/10 text-accent text-[10px] font-mono tracking-[0.25em] uppercase disabled:opacity-30 active:scale-[0.98] hover:bg-accent/15 hover:shadow-[0_0_16px_rgba(245,158,11,0.15)] transition-all duration-300 shadow-mechanical-inset"
                    >
                        {phase === 'translating' ? (
                            <span className="animate-pulse">Translating...</span>
                        ) : 'Translate Text'}
                    </button>
                </div>
            )}

            {/* Phase: Translated — show result + voice reply section */}
            {(phase === 'translated' || phase === 'recording' || phase === 'translating-reply' || phase === 'done') && (
                <div className="flex flex-col gap-4">
                    {/* Detected source label */}
                    <div className="flex items-center gap-2 opacity-50">
                        <div className="h-px flex-1 bg-divider" />
                        <span className="text-[9px] font-mono tracking-[0.2em] text-text-muted uppercase whitespace-nowrap">
                            {detectedLang} → {targetLanguage}
                        </span>
                        <div className="h-px flex-1 bg-divider" />
                    </div>

                    {/* Translation result card */}
                    <div className="relative bg-white/[0.04] border border-divider rounded-2xl p-4 shadow-mechanical-inset">
                        <p className="text-[13px] font-mono text-text-main leading-loose pr-8">{translation}</p>
                        <button
                            onClick={() => handleCopy('translation')}
                            className="absolute top-3 right-3 p-1.5 rounded-lg border border-transparent hover:border-divider hover:bg-white/5 transition-all"
                        >
                            {copied === 'translation'
                                ? <Check className="w-4 h-4 text-accent" />
                                : <Copy className="w-4 h-4 text-text-muted/50" />}
                        </button>
                    </div>

                    {/* Voice Reply section */}
                    <div className="flex flex-col items-center gap-3 py-2">
                        <span className="text-[9px] font-mono tracking-[0.2em] text-text-muted/50 uppercase">
                            Speak reply → translated to {detectedLang}
                        </span>

                        {(phase === 'translated' || phase === 'recording') && (
                            <button
                                onClick={phase === 'recording' ? handleStopRecording : handleStartRecording}
                                className={`size-14 rounded-full flex items-center justify-center transition-all duration-200 border
                                    ${phase === 'recording'
                                        ? 'border-red-500/50 bg-red-950/30 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse'
                                        : 'border-divider bg-white/[0.04] hover:border-accent/40 hover:shadow-[0_0_16px_rgba(245,158,11,0.2)] shadow-mechanical-inset'
                                    }`}
                            >
                                {phase === 'recording'
                                    ? <Square className="w-5 h-5 text-red-400 fill-current" />
                                    : <Mic className="w-5 h-5 text-text-muted" />}
                            </button>
                        )}

                        {phase === 'translating-reply' && (
                            <div className="text-[10px] font-mono tracking-widest text-text-muted animate-pulse">
                                Translating reply...
                            </div>
                        )}
                    </div>

                    {/* Translated reply card */}
                    {phase === 'done' && replyTranslation && (
                        <div className="relative bg-accent/5 border border-accent/20 rounded-2xl p-4 shadow-[0_0_12px_rgba(245,158,11,0.05)]">
                            <div className="text-[9px] font-mono tracking-[0.2em] text-accent uppercase mb-2">
                                Your Reply in {detectedLang}
                            </div>
                            <p className="text-[13px] font-mono text-text-main leading-loose pr-8">{replyTranslation}</p>
                            <button
                                onClick={() => handleCopy('reply')}
                                className="absolute top-3 right-3 p-1.5 rounded-lg border border-transparent hover:border-accent/20 hover:bg-accent/5 transition-all"
                            >
                                {copied === 'reply'
                                    ? <Check className="w-4 h-4 text-accent" />
                                    : <Copy className="w-4 h-4 text-text-muted/50" />}
                            </button>
                        </div>
                    )}

                    {/* Reset */}
                    <button
                        onClick={handleReset}
                        className="text-[9px] font-mono tracking-[0.2em] text-text-muted/40 uppercase hover:text-text-muted transition-colors text-center"
                    >
                        ← Start Over
                    </button>
                </div>
            )}
        </div>
    )
}
