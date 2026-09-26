import type { UserInputs } from './types'

const key = 'where-does-my-tax-go:user-inputs'
export const defaultUserInputs: UserInputs = { income: 75_000, province: 'ON', postalCode: '', incomeIsTypical: false }
let cachedInputs: UserInputs | undefined
const listeners = new Set<() => void>()

export function readUserInputs(): UserInputs {
  try {
    const value = sessionStorage.getItem(key)
    return value ? { ...defaultUserInputs, ...JSON.parse(value) } : defaultUserInputs
  } catch {
    return defaultUserInputs
  }
}

export function saveUserInputs(inputs: UserInputs) {
  cachedInputs = inputs
  try { sessionStorage.setItem(key, JSON.stringify(inputs)) } catch { /* private browsing can disable storage */ }
  listeners.forEach((listener) => listener())
}

export function getUserInputsSnapshot() {
  if (!cachedInputs) cachedInputs = readUserInputs()
  return cachedInputs
}

export function getServerUserInputsSnapshot() {
  return defaultUserInputs
}

export function subscribeToUserInputs(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
