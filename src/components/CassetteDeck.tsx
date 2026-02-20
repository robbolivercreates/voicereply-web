import { useState } from 'react'
import { playClickSound } from '../lib/sounds'
import type { TranscriptionMode } from '../types'
import cassetteTapeCall from '../assets/cassette_tape.png'

interface CassetteDeckProps {
    selected: TranscriptionMode
    onSelect: (mode: TranscriptionMode) => void
    disabled?: boolean
}

interface ModeConfig {
    id: TranscriptionMode
    label: string
    color: string
}

const modes: ModeConfig[] = [
    { id: 'text', label: 'TEXT MEMO', color: '#eab308' },  // Yellow
    { id: 'email', label: 'EMAIL DRAFT', color: '#3b82f6' }, // Blue
    { id: 'command', label: 'COMMAND', color: '#ef4444' },   // Red
    { id: 'social', label: 'SOCIAL', color: '#a855f7' },     // Purple
]

export function CassetteDeck({ selected, onSelect, disabled }: CassetteDeckProps) {
    const [isEjecting, setIsEjecting] = useState(false)
    const [showDrawer, setShowDrawer] = useState(false)

    const handleEject = () => {
        if (disabled) return
        playClickSound()
        setIsEjecting(true)
        setTimeout(() => {
            setShowDrawer(true)
            setIsEjecting(false)
        }, 500)
    }

    const handleInsert = (modeId: TranscriptionMode) => {
        playClickSound() // Clunk sound
        onSelect(modeId)
        setShowDrawer(false)
    }

    const currentMode = modes.find(m => m.id === selected) || modes[0]

    return (
        <div className="flex flex-col items-center gap-2 w-full max-w-[300px] mx-auto perspective-1000">

            {/* Tape Window / Deck */}
            <div className="relative w-full aspect-[1.6] bg-[#1a1a1a] rounded-lg shadow-inner border border-stone-600 overflow-hidden group">

                {/* Glass Reflection */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-white/10 to-transparent pointer-events-none z-20 rounded-lg"></div>

                {/* The Cassette Itself */}
                <div
                    className={`
            relative w-[90%] mx-auto mt-2 transition-all duration-500 ease-in-out transform
            ${isEjecting ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}
            cursor-pointer hover:scale-[1.02]
          `}
                    onClick={handleEject}
                    title="Click to Eject Tape"
                >
                    <img
                        src={cassetteTapeCall}
                        alt="Cassette Tape"
                        className="w-full h-auto drop-shadow-xl"
                    />

                    {/* Label Overlay - Dynamic Text on the generated asset */}
                    <div className="absolute top-[18%] left-[10%] right-[10%] h-[25%] bg-white/90 shadow-sm rotate-[-0.5deg] flex items-center justify-center pointer-events-none">
                        <span
                            className="font-mono font-bold text-xl tracking-widest uppercase opacity-90"
                            style={{ color: currentMode.color }}
                        >
                            {currentMode.label}
                        </span>
                    </div>

                    {/* Spools (Animated) */}
                    <div className="absolute top-[48%] left-[19%] w-[12%] aspect-square rounded-full border-2 border-stone-300/50"></div>
                    <div className="absolute top-[48%] right-[19%] w-[12%] aspect-square rounded-full border-2 border-stone-300/50"></div>
                </div>

            </div>

            {/* Tape Drawer (Selection) */}
            {showDrawer && (
                <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm rounded-xl p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-stone-800 p-4 rounded-xl border border-stone-600 shadow-2xl w-full max-w-sm">
                        <h3 className="text-stone-300 font-mono text-xs uppercase mb-3 text-center tracking-widest">Select Cassette</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {modes.map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => handleInsert(mode.id)}
                                    className={`
                     p-2 rounded border-2 transition-all flex flex-col items-center gap-2 group
                     ${selected === mode.id ? 'border-yellow-500 bg-stone-700' : 'border-stone-600 bg-stone-700/50 hover:bg-stone-700'}
                   `}
                                >
                                    {/* Mini Cassette Icon */}
                                    <div className="w-full h-8 bg-stone-900 rounded border border-stone-600 relative overflow-hidden">
                                        <div className="absolute inset-x-1 top-1 h-3 bg-white" style={{ backgroundColor: mode.color }}></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-stone-300 uppercase">{mode.label}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowDrawer(false)}
                            className="mt-4 w-full py-2 text-stone-500 hover:text-stone-300 text-xs uppercase"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
