// Sound effects using Web Audio API
let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

/** Sharp mechanical click using filtered noise burst */
export function playClickSound() {
  if (localStorage.getItem('vibeflow-sound') === 'false') return
  try {
    const ctx = getAudioContext()

    // White noise buffer (very short)
    const bufferSize = ctx.sampleRate * 0.008 // 8ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1)
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer

    // Band-pass filter gives it the "click" snap
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 3200
    filter.Q.value = 0.8

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(1.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.012)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    source.start()
    source.stop(ctx.currentTime + 0.015)
  } catch {
    // Ignore
  }
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.25,
  startDelay = 0
) {
  try {
    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = frequency
    oscillator.type = type

    const t = ctx.currentTime + startDelay
    gainNode.gain.setValueAtTime(0, t)
    gainNode.gain.linearRampToValueAtTime(volume, t + 0.005)
    gainNode.gain.linearRampToValueAtTime(0, t + duration)

    oscillator.start(t)
    oscillator.stop(t + duration)
  } catch {
    // Audio not supported
  }
}

export function playStartSound() {
  if (localStorage.getItem('vibeflow-sound') === 'false') return
  // Two-tone rising click → "armed"
  playClickSound()
  setTimeout(() => playTone(880, 0.06, 'sine', 0.15), 30)
}

export function playStopSound() {
  if (localStorage.getItem('vibeflow-sound') === 'false') return
  // Descending dull thud → "stopped"
  playClickSound()
  setTimeout(() => playTone(440, 0.08, 'sine', 0.12), 20)
}

export function playSuccessSound() {
  if (localStorage.getItem('vibeflow-sound') === 'false') return
  // Soft two-note chime
  playTone(784, 0.08, 'sine', 0.2)
  setTimeout(() => playTone(1047, 0.12, 'sine', 0.2), 90)
}

export function playErrorSound() {
  if (localStorage.getItem('vibeflow-sound') === 'false') return
  // Low buzz pair
  playTone(220, 0.1, 'square', 0.15)
  setTimeout(() => playTone(200, 0.12, 'square', 0.12), 130)
}
