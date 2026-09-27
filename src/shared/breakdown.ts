// Screen 02 breakdown: total federal spending and the biggest programs (TASKS.md Decisions #3 and #4).
// The data comes from Neon through GET /api/breakdown (src/lib/breakdown.ts). This file has no database code,
// so the UI can import the types and yourShare() safely.

import type { Source } from './types'

export type BreakdownItem = {
  name: string
  description: string
  official_name: string
  department: string
  dept_code: string
  program_code: string
  amount: number
  percent: number
}

export type Breakdown = {
  fiscal_year: string
  total_federal_spending: number
  program_count: number
  items: BreakdownItem[]
  source: Source
}

// One of the biggest programs as it comes out of the database query.
export type TopProgramRow = {
  dept_code: string
  program_code: string
  amount: number
  official_name: string | null
  department: string | null
  plain_name: string | null
  description: string | null
}

export const BREAKDOWN_SOURCE: Source = {
  label: 'GC InfoBase: Federal Programs Spending',
  url: 'https://open.canada.ca/data/en/dataset/a35cf382-690c-4221-a971-cf0fd189a46f',
}

/**
 * Purpose:
 *	Turn the data's year into the label shown in the app.
 *
 * Args:
 *	- year: the data's year, e.g. 2024 (April 2024 to March 2025)
 *
 * Returns:
 *	string: the fiscal year label, e.g. "2024-25"
 */
export function fiscalYearLabel(year: number) {
  return `${year}-${String(year + 1).slice(-2)}`
}

/**
 * Purpose:
 *	Build the breakdown from the biggest programs and the year's total: one item per program, then "All other programs".
 *
 * Args:
 *	- year: the data's year, e.g. 2024
 *	- total: total federal spending that year in dollars (sum of every program's expenditure)
 *	- programCount: how many programs had spending that year
 *	- top: the biggest programs, largest first
 *
 * Returns:
 *	Breakdown: amounts in whole dollars, percents of the total to one decimal
 */
export function toBreakdown(year: number, total: number, programCount: number, top: TopProgramRow[]): Breakdown {
  const percent = (amount: number) => Math.round((amount / total) * 1000) / 10
  const items: BreakdownItem[] = top.map((row) => ({
    // Fall back to the official name so a program without a hand-written label still shows something true.
    name: row.plain_name ?? row.official_name ?? row.program_code,
    description: row.description ?? '',
    official_name: row.official_name ?? '',
    department: row.department ?? row.dept_code,
    dept_code: row.dept_code,
    program_code: row.program_code,
    amount: Math.round(row.amount),
    percent: percent(row.amount),
  }))

  const other = total - top.reduce((sum, row) => sum + row.amount, 0)
  items.push({
    name: 'All other programs',
    description: `The other ${(programCount - top.length).toLocaleString('en-CA')} federal programs, from defence to the public service.`,
    official_name: '',
    department: '',
    dept_code: '',
    program_code: '',
    amount: Math.round(other),
    percent: percent(other),
  })

  return { fiscal_year: fiscalYearLabel(year), total_federal_spending: Math.round(total), program_count: programCount, items, source: BREAKDOWN_SOURCE }
}

/**
 * Purpose:
 *	Work out how much of a spending item the user's own federal tax paid for. Same formula on every screen.
 *
 * Args:
 *	- federalTax: the user's estimated federal income tax in dollars, from estimateTax().federal
 *	- amount: the spending item's cost in dollars
 *	- totalFederalSpending: total federal spending that year, from the breakdown's total_federal_spending
 *
 * Returns:
 *	number: the user's share in dollars, unrounded
 */
export function yourShare(federalTax: number, amount: number, totalFederalSpending: number) {
  return federalTax * (amount / totalFederalSpending)
}
