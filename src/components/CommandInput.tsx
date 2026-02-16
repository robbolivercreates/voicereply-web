import { Clipboard, X } from 'lucide-react'

interface CommandInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function CommandInput({ value, onChange, disabled }: CommandInputProps) {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      onChange(text)
    } catch {
      // Clipboard access denied
    }
  }

  const handleClear = () => {
    onChange('')
  }

  return (
    <div className="glass rounded-2xl p-4 animate-in">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-400">Text to Transform</p>
        <div className="flex gap-2">
          <button
            onClick={handlePaste}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors disabled:opacity-50"
          >
            <Clipboard className="w-3.5 h-3.5" />
            Paste
          </button>
          {value && (
            <button
              onClick={handleClear}
              disabled={disabled}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Paste or type the text you want to transform...

Then hold the mic button and say a command like:
• &quot;translate to English&quot;
• &quot;make it more professional&quot;
• &quot;summarize this&quot;
• &quot;simplify&quot;
• &quot;fix grammar&quot;"
        className="w-full h-32 bg-slate-900/50 border border-white/10 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50"
      />

      {value && (
        <p className="text-xs text-slate-500 mt-2">
          {value.length} characters • Now hold the mic and say your command
        </p>
      )}
    </div>
  )
}
