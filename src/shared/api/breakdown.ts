import { receiptCategories, mockFiscalYear, mockTotalFederalSpending } from '../fixtures'
import type { BreakdownResponse } from '../types'
import { apiGet, hasLiveApi } from './client'

const mockSource = { label: 'Government of Canada · mock source', url: 'https://www.canada.ca/en.html' }

export async function getBreakdown(): Promise<BreakdownResponse> {
  if (hasLiveApi()) return apiGet<BreakdownResponse>('/breakdown')
  return { fiscalYear: mockFiscalYear, totalFederalSpending: mockTotalFederalSpending, categories: receiptCategories, source: mockSource }
}
