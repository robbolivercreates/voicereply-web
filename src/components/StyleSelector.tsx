import type { TranscriptionMode } from '../types'
import { playClickSound } from '../lib/sounds'

interface ModeSelectorProps {
  selected: TranscriptionMode
  onSelect: (mode: TranscriptionMode) => void
  disabled?: boolean
}

interface ModeConfig {
  id: TranscriptionMode
  label: string
}

// Available modes for web app
const modes: ModeConfig[] = [
  { id: 'text', label: 'TXT' },
  { id: 'email', label: 'MAIL' },
  { id: 'command', label: 'CMD' },
  { id: 'social', label: 'SOC' },
]

export function StyleSelector({ selected, onSelect, disabled }: ModeSelectorProps) {
  const selectedIndex = modes.findIndex(m => m.id === selected)

  const handleSelect = (id: TranscriptionMode) => {
    if (disabled) return
    playClickSound()
    onSelect(id)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-bold text-stone-500 tracking-widest uppercase">Mode Select</span>

      <div className="relative p-1 bg-[#dcd8cc] rounded-lg border border-white/20 shadow-vintage-inset">

        {/* Track */}
        <div className="relative w-64 h-12 bg-[#1a1a1a] rounded flex items-center shadow-inner border-b border-white/10">

          {/* Grooves for positions */}
          {modes.map((mode) => (
            <div key={mode.id} className="flex-1 h-full flex items-center justify-center border-r border-white/5 last:border-0 relative group cursor-pointer" onClick={() => handleSelect(mode.id)}>
              {/* Click target */}
              <div className="w-1 h-2 bg-stone-700 rounded-full opacity-50"></div>
            </div>
          ))}

          {/* Moving Switch Knob */}
          <div
            className="absolute top-0.5 bottom-0.5 w-[24%] bg-stone-300 rounded shadow-[0_2px_5px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,0.5)] transition-all duration-300 ease-out border-b-2 border-stone-400 z-10 flex flex-col items-center justify-center gap-0.5 cursor-grab active:cursor-grabbing"
            style={{
              left: `${(selectedIndex / 4) * 100}%`,
              transform: `translateX(${2 + selectedIndex * 2}px)` // Fine tune padding offset 
            }}
          >
            {/* Grip texture */}
            <div className="w-4 h-0.5 bg-stone-400 rounded-full"></div>
            <div className="w-4 h-0.5 bg-stone-400 rounded-full"></div>
            <div className="w-4 h-0.5 bg-stone-400 rounded-full"></div>
          </div>
        </div>

        {/* Labels under track */}
        <div className="flex justify-between px-4 mt-2 w-64">
          {modes.map(mode => (
            <span
              key={mode.id}
              className={`text-[10px] font-mono font-bold transition-colors duration-300 ${selected === mode.id ? 'text-stone-800' : 'text-stone-400'}`}
            >
              {mode.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
