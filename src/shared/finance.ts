import type { Source, TaxEstimate } from './types'

export const mockTaxSource: Source = {
  label: 'Illustrative tax estimate · mock source',
  url: 'https://www.canada.ca/en/services/taxes.html',
}

export const money = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })
export const cents = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function calculateFederalTax(income: number): TaxEstimate {
  return {
    fiscalYear: '2024-25',
    federal: Math.round(9510 * (income / 75_000)),
    source: mockTaxSource,
  }
}

export function calculatePersonalShare(federalTax: number, itemAmount: number, totalFederalSpending: number) {
  if (!Number.isFinite(totalFederalSpending) || totalFederalSpending <= 0) return null
  return federalTax * (itemAmount / totalFederalSpending)
}

export function formatPersonalShare(federalTax: number, itemAmount: number, totalFederalSpending: number) {
  const share = calculatePersonalShare(federalTax, itemAmount, totalFederalSpending)
  return share === null ? 'Unavailable' : cents.format(share)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`))
}
