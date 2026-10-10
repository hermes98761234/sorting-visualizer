import { useEffect, useRef } from 'react'

interface Props { values: number[]; max: number; hi: [number, number] | null; kind: 'cmp' | 'swap' | 'write' | null; done: boolean }

function css(name: string) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() }

/** Bar chart on a canvas: amber = comparing, red = moving/writing, green = finished. */
export default function Bars({ values, max, hi, kind, done }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current!
    const dpr = window.devicePixelRatio || 1
    const w = cv.clientWidth, h = cv.clientHeight
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr) }
    const g = cv.getContext('2d')!
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, w, h)
    const n = values.length
    const bw = w / n
    const gap = bw > 6 ? 1.5 : bw > 3 ? 1 : 0
    const base = css('--accent') || '#7c3aed'
    const ok = css('--ok') || '#16a34a'
    const hot = kind === 'cmp' ? css('--warn') || '#d97706' : css('--err') || '#dc2626'
    for (let i = 0; i < n; i++) {
      const bh = Math.max(2, (values[i] / max) * (h - 4))
      g.fillStyle = done ? ok : hi && (i === hi[0] || i === hi[1]) ? hot : base
      g.fillRect(i * bw, h - bh, Math.max(1, bw - gap), bh)
    }
    if (n <= 30) {
      g.fillStyle = css('--chart-bg') || '#fff'
      g.font = '11px system-ui'
      g.textAlign = 'center'
      for (let i = 0; i < n; i++) g.fillText(String(values[i]), i * bw + bw / 2, h - 5)
    }
  })
  return <canvas ref={ref} className="bars" role="img" aria-label="bars" />
}
