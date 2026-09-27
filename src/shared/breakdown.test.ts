import { describe, expect, it } from 'vitest'
import { fiscalYearLabel, toBreakdown, yourShare, type TopProgramRow } from './breakdown'
import { howWeCalculate } from './howWeCalculate'

// Shaped like the Neon query result for 2024-25, so these tests need no database.
const TOTAL = 472_529_869_720
const top: TopProgramRow[] = [
  { dept_code: 'HRSD', program_code: 'BGN01', amount: 80_762_279_357, official_name: 'Old Age Security', department: 'Employment and Social Development Canada', plain_name: 'Old Age Security pensions', description: 'Monthly payments to Canadians aged 65 and over.' },
  { dept_code: 'FIN', program_code: 'BUV07', amount: 52_066_000_000, official_name: 'Canada Health Transfer', department: 'Department of Finance Canada', plain_name: 'Health care transfer to provinces', description: 'Health care.' },
  { dept_code: 'XX', program_code: 'ZZ001', amount: 1_000_000_000, official_name: 'Unlabelled Program', department: null, plain_name: null, description: null },
]

describe('toBreakdown', () => {
  const breakdown = toBreakdown(2024, TOTAL, 1228, top)

  it('lists the programs biggest first, then "All other programs"', () => {
    expect(breakdown.items.map((item) => item.name)).toEqual(['Old Age Security pensions', 'Health care transfer to provinces', 'Unlabelled Program', 'All other programs'])
    expect(breakdown.items.at(-1)?.description).toContain('1,225')
  })

  it('adds up to total federal spending', () => {
    const sum = breakdown.items.reduce((total, item) => total + item.amount, 0)
    expect(Math.abs(sum - TOTAL)).toBeLessThanOrEqual(breakdown.items.length)
    const percents = breakdown.items.reduce((total, item) => total + item.percent, 0)
    expect(Math.abs(percents - 100)).toBeLessThanOrEqual(0.5)
    expect(breakdown.items[0].percent).toBe(17.1)
  })

  it('falls back to the official name and dept code when a label or department is missing', () => {
    const unlabelled = breakdown.items[2]
    expect(unlabelled.name).toBe('Unlabelled Program')
    expect(unlabelled.department).toBe('XX')
    expect(unlabelled.description).toBe('')
  })

  it('labels the fiscal year and links the source', () => {
    expect(breakdown.fiscal_year).toBe('2024-25')
    expect(fiscalYearLabel(1999)).toBe('1999-00')
    expect(breakdown.source.url).toMatch(/^https:\/\/open\.canada\.ca\//)
  })
})

describe('yourShare', () => {
  it('splits federal tax in proportion to spending', () => {
    expect(yourShare(10_000, TOTAL, TOTAL)).toBeCloseTo(10_000)
    expect(yourShare(10_000, TOTAL / 100, TOTAL)).toBeCloseTo(100)
    expect(yourShare(0, 1_000_000, TOTAL)).toBe(0)
  })
})

describe('howWeCalculate', () => {
  it('uses the breakdown numbers in its worked example', () => {
    const text = howWeCalculate(toBreakdown(2024, TOTAL, 1228, top)).flatMap((section) => section.body).join(' ')
    expect(text).toContain('$472.5 billion')
    expect(text).toContain('$8,920')
    expect(text).toContain('≈ $1,525')
  })
})
