import { describe, expect, it } from 'vitest'
import { ALGOS, apply, count, makeData, record, undo, type Pattern } from './sorting'

const patterns: Pattern[] = ['random', 'nearly', 'reversed', 'few']
const sorted = (a: number[]) => [...a].sort((x, y) => x - y)

describe('algorithms', () => {
  for (const algo of ALGOS) {
    it(`${algo.name} sorts every pattern and size, and events are reversible`, () => {
      for (const p of patterns) for (const n of [0, 1, 2, 3, 10, 57, 150]) {
        const input = makeData(n, p, 7 + n)
        const ev = record(algo.id, input)
        const a = [...input]
        for (const e of ev) apply(a, e)
        expect(a, `${p} ${n}`).toEqual(sorted(input))
        for (let k = ev.length - 1; k >= 0; k--) undo(a, ev[k])
        expect(a).toEqual(input)
      }
    })
  }
  it('has textbook comparison counts', () => {
    const n = 20
    const asc = makeData(n, 'nearly', 1).sort((a, b) => a - b)
    expect(count(record('bubble', asc)).cmp).toBe(n - 1)
    expect(count(record('insertion', asc)).cmp).toBe(n - 1)
    expect(count(record('selection', asc)).cmp).toBe((n * (n - 1)) / 2)
    const rev = makeData(n, 'reversed', 1)
    expect(count(record('bubble', rev)).swap).toBe((n * (n - 1)) / 2)
    expect(count(record('insertion', rev)).swap).toBe((n * (n - 1)) / 2)
    expect(count(record('selection', rev)).swap).toBe(n / 2)
  })
  it('merge sort stays within n log n and radix does no comparisons', () => {
    const input = makeData(128, 'random', 3)
    expect(count(record('merge', input)).cmp).toBeLessThanOrEqual(128 * 7)
    expect(count(record('radix', input)).cmp).toBe(0)
  })
  it('makeData is deterministic and a permutation for random', () => {
    expect(makeData(30, 'random', 5)).toEqual(makeData(30, 'random', 5))
    expect(sorted(makeData(30, 'random', 5))).toEqual(Array.from({ length: 30 }, (_, i) => i + 1))
  })
})
