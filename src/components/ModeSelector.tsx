import { playClickSound } from '../lib/sounds'
import type { TranscriptionMode } from '../types'

interface ModeSelectorProps {
    selected: TranscriptionMode
    onSelect: (mode: TranscriptionMode) => void
    disabled?: boolean
}

const modes: { id: TranscriptionMode; label: string }[] = [
    { id: 'text', label: 'Text' },
    { id: 'email', label: 'Email' },
    { id: 'social', label: 'Social' },
    { id: 'translate', label: 'Translate' },
]

export function ModeSelector({ selected, onSelect, disabled }: ModeSelectorProps) {

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex p-1 rounded-full border border-divider/30 bg-black/40 shadow-mechanical-inset backdrop-blur-md">
                {modes.map((m) => {
                    const isActive = selected === m.id
                    return (
                        <button
                            key={m.id}
                            disabled={disabled}
                            onClick={() => {
                                playClickSound()
                                onSelect(m.id)
                            }}
                            className={`
                relative px-4 py-1.5 text-[8px] sm:text-[9px] font-sans font-bold tracking-widest uppercase transition-all duration-300
                rounded-full
                ${isActive
                                    ? 'bg-accent/10 text-accent border border-accent/20'
                                    : 'text-text-muted/60 hover:text-text-muted hover:bg-white/5 border border-transparent'
                                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
                        >
                            <span className="relative z-10">{m.label}</span>

                            {/* Active Indicator Dot - The "Light" */}
                            {isActive && (
                                <div className="absolute top-[3px] right-[3px] size-1 bg-accent rounded-full shadow-[0_0_6px_rgba(245,158,11,0.8)] animate-pulse"></div>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
