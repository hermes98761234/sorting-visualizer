import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Footer, Toolbar, usePrefs, useStored } from './ui'
import { N } from './i18n'
import { ALGOS, apply, count, makeData, record, undo, type AlgoId, type Counts, type Pattern } from './lib/sorting'
import Bars from './components/Bars'
import { beep } from './sound'

const NAMES: Record<AlgoId, string> = {
  bubble: N('Bubble sort'), insertion: N('Insertion sort'), selection: N('Selection sort'), merge: N('Merge sort'),
  quick: N('Quicksort'), heap: N('Heap sort'), shell: N('Shell sort'), radix: N('Radix sort (LSD)'),
}
const PATTERNS: [Pattern, string][] = [['random', N('Random')], ['nearly', N('Nearly sorted')], ['reversed', N('Reversed')], ['few', N('Few unique')]]

interface Cfg { algo: AlgoId; n: number; pattern: Pattern; seed: number; speed: number; sound: boolean }
const DEF: Cfg = { algo: 'quick', n: 60, pattern: 'random', seed: 1, speed: 50, sound: false }

function fromHash(c: Cfg): Cfg {
  const q = new URLSearchParams(location.hash.slice(1))
  const algo = q.get('a') as AlgoId, n = Number(q.get('n')), pattern = q.get('p') as Pattern, seed = Number(q.get('s'))
  return {
    ...c,
    algo: ALGOS.some((a) => a.id === algo) ? algo : c.algo,
    n: n >= 5 && n <= 300 ? n : c.n,
    pattern: PATTERNS.some(([p]) => p === pattern) ? pattern : c.pattern,
    seed: Number.isFinite(seed) && seed > 0 ? seed : c.seed,
  }
}

export default function App() {
  const prefs = usePrefs()
  const { t } = prefs
  const [stored, setStored] = useStored<Cfg>('sorting-visualizer-v1', DEF)
  const [cfg, setCfgRaw] = useState<Cfg>(() => fromHash(stored))
  const setCfg = (p: Partial<Cfg>) => { setCfgRaw((c) => ({ ...c, ...p })); setPos(0); setPlaying(false) }
  useEffect(() => {
    setStored(cfg)
    history.replaceState(null, '', `#a=${cfg.algo}&n=${cfg.n}&p=${cfg.pattern}&s=${cfg.seed}`)
  }, [cfg, setStored])

  const input = useMemo(() => makeData(cfg.n, cfg.pattern, cfg.seed), [cfg.n, cfg.pattern, cfg.seed])
  const events = useMemo(() => record(cfg.algo, input), [cfg.algo, input])
  const [pos, setPos] = useState(0)
  const [playing, setPlaying] = useState(false)

  // The array at `pos` is rebuilt incrementally from the last rendered position.
  const arrRef = useRef<{ a: number[]; pos: number; key: unknown }>({ a: [], pos: 0, key: null })
  const values = useMemo(() => {
    const s = arrRef.current
    if (s.key !== events) { s.a = [...input]; s.pos = 0; s.key = events }
    while (s.pos < pos) apply(s.a, events[s.pos++])
    while (s.pos > pos) undo(s.a, events[--s.pos])
    return [...s.a]
  }, [events, input, pos])

  const counts: Counts = useMemo(() => count(events, pos), [events, pos])
  const total = useMemo(() => count(events), [events])
  const last = pos > 0 ? events[pos - 1] : null
  const done = pos >= events.length
  const speedRef = useRef(cfg.speed)
  speedRef.current = cfg.speed
  const soundRef = useRef(cfg.sound)
  soundRef.current = cfg.sound

  const advance = useCallback((k: number) => {
    setPos((p) => {
      const np = Math.max(0, Math.min(events.length, p + k))
      if (soundRef.current && np > 0) {
        const e = events[np - 1]
        beep(e.t === 'cmp' ? e.i : e.t === 'swap' ? e.j : e.i, input.length)
      }
      return np
    })
  }, [events, input.length])

  useEffect(() => {
    if (!playing) return
    let raf = 0, prev = performance.now(), acc = 0
    const loop = (now: number) => {
      // speed 1..100 → 2..3000 operations per second, exponential
      const rate = 2 * Math.pow(1500, (speedRef.current - 1) / 99)
      acc += ((now - prev) / 1000) * rate
      prev = now
      const k = Math.floor(acc)
      if (k > 0) { acc -= k; advance(k) }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing, advance])
  useEffect(() => { if (done && playing) setPlaying(false) }, [done, playing])

  const info = ALGOS.find((a) => a.id === cfg.algo)!
  const hi: [number, number] | null = last && !done ? (last.t === 'write' ? [last.i, last.i] : [last.i, last.j]) : null

  return (
    <div className="app">
      <Toolbar title={t('Sorting Visualizer')} hint={t('Watch eight sorting algorithms work, step by step.')} prefs={prefs} />
      <main className="main">
        <div className="box">
          <div className="algos">
            {ALGOS.map((a) => (
              <button key={a.id} className={a.id === cfg.algo ? 'active' : ''} onClick={() => setCfg({ algo: a.id })}>{t(NAMES[a.id])}</button>
            ))}
          </div>
        </div>
        <div className="box">
          <div className="canvas-wrap">
            <Bars values={values} max={cfg.n} hi={hi} kind={last ? (last.t === 'cmp' ? 'cmp' : last.t) : null} done={done && events.length > 0} />
          </div>
          <div className="controls" style={{ marginTop: 10 }}>
            <button className="primary" onClick={() => { if (done) setPos(0); setPlaying((p) => !p) }}>{playing ? t('Pause') : done ? t('Replay') : t('Play')}</button>
            <button onClick={() => { setPlaying(false); advance(-1) }} disabled={pos === 0} aria-label={t('Step back')}>◀ {t('Step')}</button>
            <button onClick={() => { setPlaying(false); advance(1) }} disabled={done} aria-label={t('Step forward')}>{t('Step')} ▶</button>
            <button onClick={() => { setPlaying(false); setPos(0) }} disabled={pos === 0}>{t('Reset')}</button>
            <label>{t('Speed')}
              <input type="range" min={1} max={100} value={cfg.speed} onChange={(e) => setCfgRaw((c) => ({ ...c, speed: Number(e.target.value) }))} />
            </label>
            <label>{t('Size: {0}', cfg.n)}
              <input type="range" min={5} max={300} value={cfg.n} onChange={(e) => setCfg({ n: Number(e.target.value) })} />
            </label>
            <label>{t('Data')}
              <select value={cfg.pattern} onChange={(e) => setCfg({ pattern: e.target.value as Pattern })}>
                {PATTERNS.map(([p, l]) => <option key={p} value={p}>{t(l)}</option>)}
              </select>
            </label>
            <button onClick={() => setCfg({ seed: Math.floor(Math.random() * 1e6) + 1 })}>{t('New data')}</button>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={cfg.sound} onChange={(e) => setCfgRaw((c) => ({ ...c, sound: e.target.checked }))} />{t('Sound')}
            </label>
          </div>
        </div>
        <div className="box">
          <div className="stats">
            <div className="stat"><b>{counts.cmp}</b><span>{t('Comparisons')}</span></div>
            <div className="stat"><b>{counts.swap}</b><span>{t('Swaps')}</span></div>
            <div className="stat"><b>{counts.write}</b><span>{t('Writes')}</span></div>
            <div className="stat"><b>{pos} / {events.length}</b><span>{t('Steps')}</span></div>
            <div className="stat"><b>{total.cmp} / {total.swap} / {total.write}</b><span>{t('Totals for this run: cmp / swap / write')}</span></div>
          </div>
        </div>
        <div className="box">
          <h3>{t(NAMES[cfg.algo])}</h3>
          <table className="data">
            <thead><tr><th>{t('Best')}</th><th>{t('Average')}</th><th>{t('Worst')}</th><th>{t('Extra space')}</th><th>{t('Stable')}</th></tr></thead>
            <tbody><tr><td>O({info.best})</td><td>O({info.avg})</td><td>O({info.worst})</td><td>O({info.space})</td><td>{info.stable ? t('yes') : t('no')}</td></tr></tbody>
          </table>
          <p className="hint" style={{ marginTop: 8 }}>{t('Amber bars are being compared, red bars are being moved or written, green means sorted.')}</p>
        </div>
      </main>
      <Footer repo="sorting-visualizer" note={t('Counts are exact for the data shown. Share the page URL to share the setup.')} t={t} />
    </div>
  )
}
