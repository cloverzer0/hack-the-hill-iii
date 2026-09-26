import { mockFiscalYear, mockTotalFederalSpending, spendingById, spendingItems } from '../fixtures'
import type { DepartmentsResponse, Source, SpendingItem, SpendingResponse } from '../types'
import { apiGet, hasLiveApi } from './client'
import { ApiError, NotFoundError } from './errors'

const mockSource: Source = { label: 'Government of Canada · mock source', url: 'https://www.canada.ca/en.html' }

function matchesDepartment(item: SpendingItem, department?: string) {
  if (!department) return true
  if (department === 'National Defence') return item.department === 'Department of National Defence'
  if (department === 'Grants') return item.department.includes('Housing') || item.recipient.includes('Housing')
  if (department === 'Running federal departments') return item.department !== 'Department of National Defence' && !item.department.includes('Housing')
  return item.department === department
}

export async function getSpendingItems(query: { department?: string } = {}): Promise<SpendingResponse> {
  if (hasLiveApi()) {
    const search = query.department ? `?department=${encodeURIComponent(query.department)}` : ''
    return apiGet<SpendingResponse>(`/spending${search}`)
  }
  return { fiscalYear: mockFiscalYear, totalFederalSpending: mockTotalFederalSpending, items: spendingItems.filter((item) => matchesDepartment(item, query.department)).sort((a, b) => b.amount - a.amount), source: mockSource }
}

export async function getSpendingItem(id: string): Promise<SpendingItem> {
  if (hasLiveApi()) {
    try {
      return await apiGet<SpendingItem>(`/spending/${encodeURIComponent(id)}`)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) throw new NotFoundError()
      throw error
    }
  }
  const item = spendingById(id)
  if (!item) throw new NotFoundError()
  return item
}

export async function getDepartments(): Promise<DepartmentsResponse> {
  if (hasLiveApi()) return apiGet<DepartmentsResponse>('/departments')
  return { departments: [...new Set(spendingItems.map((item) => item.department))].sort(), source: mockSource }
}
