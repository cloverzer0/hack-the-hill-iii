import type { UserInputs } from './types'

const key = 'where-does-my-tax-go:user-inputs'
const fallback: UserInputs = { income: 75_000, province: 'ON', postalCode: '', incomeIsTypical: false }

export function readUserInputs(): UserInputs {
  try {
    const value = sessionStorage.getItem(key)
    return value ? { ...fallback, ...JSON.parse(value) } : fallback
  } catch {
    return fallback
  }
}

export function saveUserInputs(inputs: UserInputs) {
  try { sessionStorage.setItem(key, JSON.stringify(inputs)) } catch { /* private browsing can disable storage */ }
}
