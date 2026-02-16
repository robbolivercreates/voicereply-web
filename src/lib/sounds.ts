// Sound effects using Web Audio API
let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
  try {
    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = frequency
    oscillator.type = type

    // Fade in
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01)

    // Fade out
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch {
    // Audio not supported
  }
}

export function playStartSound() {
  if (localStorage.getItem('vibeflow-sound') === 'false') return

  // Rising tone - indicates start
  playTone(440, 0.1, 'sine') // A4
  setTimeout(() => playTone(554, 0.1, 'sine'), 80) // C#5
  setTimeout(() => playTone(659, 0.15, 'sine'), 160) // E5
}

export function playStopSound() {
  if (localStorage.getItem('vibeflow-sound') === 'false') return

  // Falling tone - indicates stop/processing
  playTone(659, 0.1, 'sine') // E5
  setTimeout(() => playTone(554, 0.1, 'sine'), 80) // C#5
  setTimeout(() => playTone(440, 0.15, 'sine'), 160) // A4
}

export function playSuccessSound() {
  if (localStorage.getItem('vibeflow-sound') === 'false') return

  // Happy chime - indicates success
  playTone(523, 0.1, 'sine') // C5
  setTimeout(() => playTone(659, 0.1, 'sine'), 100) // E5
  setTimeout(() => playTone(784, 0.2, 'sine'), 200) // G5
}

export function playErrorSound() {
  if (localStorage.getItem('vibeflow-sound') === 'false') return

  // Low buzz - indicates error
  playTone(200, 0.15, 'square')
  setTimeout(() => playTone(180, 0.2, 'square'), 150)
}
