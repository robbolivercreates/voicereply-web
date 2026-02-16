import { FileText, Mail, Wand2, MessageCircleHeart } from 'lucide-react'
import type { TranscriptionMode } from '../types'

interface ModeSelectorProps {
  selected: TranscriptionMode
  onSelect: (mode: TranscriptionMode) => void
  disabled?: boolean
}

interface ModeConfig {
  id: TranscriptionMode
  label: string
  icon: React.ReactNode
  description: string
  color: string
}

// Available modes for web app
const modes: ModeConfig[] = [
  {
    id: 'text',
    label: 'Text',
    icon: <FileText className="w-4 h-4" />,
    description: 'Clean, well-formatted text',
    color: 'from-emerald-500 to-green-500',
  },
  {
    id: 'email',
    label: 'Email',
    icon: <Mail className="w-4 h-4" />,
    description: 'Professional email formatting',
    color: 'from-orange-500 to-amber-500',
  },
  {
    id: 'command',
    label: 'Command',
    icon: <Wand2 className="w-4 h-4" />,
    description: 'Transform pasted text with voice commands',
    color: 'from-amber-500 to-yellow-500',
  },
  {
    id: 'social',
    label: 'Social',
    icon: <MessageCircleHeart className="w-4 h-4" />,
    description: 'Reply coach for conversations',
    color: 'from-pink-500 to-rose-500',
  },
]

export function StyleSelector({ selected, onSelect, disabled }: ModeSelectorProps) {
  return (
    <div className="card-premium rounded-2xl p-5">
      <p className="text-sm text-white/50 mb-4 font-medium">Mode</p>
      <div className="flex flex-wrap gap-2">
        {modes.map((mode) => {
          const isActive = selected === mode.id
          return (
            <button
              key={mode.id}
              onClick={() => onSelect(mode.id)}
              disabled={disabled}
              className={`
                group relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-300 ease-out
                ${isActive
                  ? `bg-gradient-to-r ${mode.color} text-white shadow-lg`
                  : 'glass text-white/60 hover:text-white/90 hover:bg-white/5'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}
              `}
              title={mode.description}
            >
              <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {mode.icon}
              </span>
              <span>{mode.label}</span>

              {/* Active indicator */}
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
              )}
            </button>
          )
        })}
      </div>

      {/* Mode description */}
      <p className="mt-4 text-xs text-white/40 text-center">
        {modes.find(m => m.id === selected)?.description}
      </p>
    </div>
  )
}
