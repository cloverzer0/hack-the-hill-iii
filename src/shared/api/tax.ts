import { calculateFederalTax } from '../finance'
import type { TaxEstimate, UserInputs } from '../types'
import { apiGet, hasLiveApi } from './client'

export async function getTaxEstimate(inputs: UserInputs): Promise<TaxEstimate> {
  if (hasLiveApi()) return apiGet<TaxEstimate>(`/tax?income=${encodeURIComponent(inputs.income)}&province=${encodeURIComponent(inputs.province)}`)
  return calculateFederalTax(inputs.income)
}
