let ctx: AudioContext | null = null
let last = 0

/** Short sine blip whose pitch follows the bar position. */
export function beep(index: number, n: number) {
  const now = performance.now()
  if (now - last < 15) return
  last = now
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = 220 + (index / Math.max(1, n - 1)) * 880
    g.gain.setValueAtTime(0.06, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08)
    o.connect(g).connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + 0.09)
  } catch { /* audio unavailable */ }
}
