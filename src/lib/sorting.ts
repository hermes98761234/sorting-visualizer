/** Every algorithm records the primitive operations it performs; the UI replays them. */
export type Ev =
  | { t: 'cmp'; i: number; j: number }
  | { t: 'swap'; i: number; j: number }
  | { t: 'write'; i: number; v: number; old: number }

export type AlgoId = 'bubble' | 'insertion' | 'selection' | 'merge' | 'quick' | 'heap' | 'shell' | 'radix'

export interface AlgoInfo { id: AlgoId; name: string; best: string; avg: string; worst: string; space: string; stable: boolean }

export const ALGOS: AlgoInfo[] = [
  { id: 'bubble', name: 'Bubble sort', best: 'n', avg: 'n²', worst: 'n²', space: '1', stable: true },
  { id: 'insertion', name: 'Insertion sort', best: 'n', avg: 'n²', worst: 'n²', space: '1', stable: true },
  { id: 'selection', name: 'Selection sort', best: 'n²', avg: 'n²', worst: 'n²', space: '1', stable: false },
  { id: 'merge', name: 'Merge sort', best: 'n log n', avg: 'n log n', worst: 'n log n', space: 'n', stable: true },
  { id: 'quick', name: 'Quicksort', best: 'n log n', avg: 'n log n', worst: 'n²', space: 'log n', stable: false },
  { id: 'heap', name: 'Heap sort', best: 'n log n', avg: 'n log n', worst: 'n log n', space: '1', stable: false },
  { id: 'shell', name: 'Shell sort', best: 'n log n', avg: 'n^1.3', worst: 'n²', space: '1', stable: false },
  { id: 'radix', name: 'Radix sort (LSD)', best: 'nk', avg: 'nk', worst: 'nk', space: 'n + b', stable: true },
]

class Ctx {
  a: number[]
  ev: Ev[] = []
  constructor(input: number[]) { this.a = [...input] }
  /** a[i] > a[j] */
  gt(i: number, j: number) { this.ev.push({ t: 'cmp', i, j }); return this.a[i] > this.a[j] }
  swap(i: number, j: number) {
    if (i === j) return
    ;[this.a[i], this.a[j]] = [this.a[j], this.a[i]]
    this.ev.push({ t: 'swap', i, j })
  }
  write(i: number, v: number) {
    this.ev.push({ t: 'write', i, v, old: this.a[i] })
    this.a[i] = v
  }
}

function bubble(c: Ctx) {
  const n = c.a.length
  for (let end = n - 1; end > 0; end--) {
    let swapped = false
    for (let i = 0; i < end; i++) if (c.gt(i, i + 1)) { c.swap(i, i + 1); swapped = true }
    if (!swapped) break
  }
}
function insertion(c: Ctx) {
  for (let i = 1; i < c.a.length; i++) for (let j = i; j > 0 && c.gt(j - 1, j); j--) c.swap(j - 1, j)
}
function selection(c: Ctx) {
  const n = c.a.length
  for (let i = 0; i < n - 1; i++) {
    let m = i
    for (let j = i + 1; j < n; j++) if (c.gt(m, j)) m = j
    c.swap(i, m)
  }
}
function merge(c: Ctx) {
  const rec = (lo: number, hi: number) => {
    if (hi - lo < 2) return
    const mid = (lo + hi) >> 1
    rec(lo, mid)
    rec(mid, hi)
    const left = c.a.slice(lo, mid)
    const right = c.a.slice(mid, hi)
    let i = 0, j = 0, k = lo
    while (i < left.length && j < right.length) {
      // compare the two candidates (shown at their current slots)
      c.ev.push({ t: 'cmp', i: lo + i, j: mid + j })
      if (left[i] <= right[j]) c.write(k++, left[i++])
      else c.write(k++, right[j++])
    }
    while (i < left.length) c.write(k++, left[i++])
    while (j < right.length) c.write(k++, right[j++])
  }
  rec(0, c.a.length)
}
function quick(c: Ctx) {
  const rec = (lo: number, hi: number) => {
    if (lo >= hi) return
    // median of three moved to the end as pivot (avoids the sorted-input worst case)
    const mid = (lo + hi) >> 1
    if (c.gt(lo, mid)) c.swap(lo, mid)
    if (c.gt(lo, hi)) c.swap(lo, hi)
    if (c.gt(mid, hi)) c.swap(mid, hi)
    c.swap(mid, hi)
    let s = lo
    for (let i = lo; i < hi; i++) if (c.gt(hi, i)) c.swap(i, s++)
    c.swap(s, hi)
    rec(lo, s - 1)
    rec(s + 1, hi)
  }
  rec(0, c.a.length - 1)
}
function heap(c: Ctx) {
  const n = c.a.length
  const sift = (root: number, size: number) => {
    for (;;) {
      let big = root
      const l = 2 * root + 1, r = l + 1
      if (l < size && c.gt(l, big)) big = l
      if (r < size && c.gt(r, big)) big = r
      if (big === root) return
      c.swap(root, big)
      root = big
    }
  }
  for (let i = (n >> 1) - 1; i >= 0; i--) sift(i, n)
  for (let end = n - 1; end > 0; end--) { c.swap(0, end); sift(0, end) }
}
const CIURA = [701, 301, 132, 57, 23, 10, 4, 1]
function shell(c: Ctx) {
  const n = c.a.length
  for (const gap of CIURA) {
    if (gap >= n && gap !== 1) continue
    for (let i = gap; i < n; i++) for (let j = i; j >= gap && c.gt(j - gap, j); j -= gap) c.swap(j - gap, j)
  }
}
function radix(c: Ctx) {
  const n = c.a.length
  const max = Math.max(0, ...c.a)
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    const out: number[][] = Array.from({ length: 10 }, () => [])
    for (let i = 0; i < n; i++) out[Math.floor(c.a[i] / exp) % 10].push(c.a[i])
    let k = 0
    for (const bucket of out) for (const v of bucket) { if (c.a[k] !== v) c.write(k, v); else c.ev.push({ t: 'cmp', i: k, j: k }); k++ }
  }
}

const IMPL: Record<AlgoId, (c: Ctx) => void> = { bubble, insertion, selection, merge, quick, heap, shell, radix }

/** Runs the algorithm on a copy of `input` and returns the recorded operations. */
export function record(id: AlgoId, input: number[]): Ev[] {
  const c = new Ctx(input)
  IMPL[id](c)
  return c.ev
}

export function apply(a: number[], e: Ev) {
  if (e.t === 'swap') [a[e.i], a[e.j]] = [a[e.j], a[e.i]]
  else if (e.t === 'write') a[e.i] = e.v
}
export function undo(a: number[], e: Ev) {
  if (e.t === 'swap') [a[e.i], a[e.j]] = [a[e.j], a[e.i]]
  else if (e.t === 'write') a[e.i] = e.old
}

export interface Counts { cmp: number; swap: number; write: number }
export function count(ev: Ev[], upTo = ev.length): Counts {
  const c = { cmp: 0, swap: 0, write: 0 }
  for (let k = 0; k < upTo; k++) {
    const e = ev[k]
    if (e.t === 'cmp') { if (e.i !== e.j) c.cmp++ } else if (e.t === 'swap') c.swap++
    else c.write++
  }
  return c
}

export type Pattern = 'random' | 'nearly' | 'reversed' | 'few'

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function makeData(n: number, pattern: Pattern, seed: number): number[] {
  const r = mulberry32(seed)
  const a = Array.from({ length: n }, (_, i) => i + 1)
  const shuffle = () => { for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } }
  if (pattern === 'random') shuffle()
  else if (pattern === 'reversed') a.reverse()
  else if (pattern === 'nearly') for (let k = 0; k < Math.max(1, Math.floor(n / 10)); k++) { const i = Math.floor(r() * n), j = Math.floor(r() * n); [a[i], a[j]] = [a[j], a[i]] }
  else { const levels = 5; return Array.from({ length: n }, () => (1 + Math.floor(r() * levels)) * Math.ceil(n / levels)) }
  return a
}
