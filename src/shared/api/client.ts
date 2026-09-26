import { ApiError } from './errors'

const apiBaseUrl = process.env.NEXT_PUBLIC_SPENDING_API_URL?.replace(/\/$/, '')

export function hasLiveApi() {
  return Boolean(apiBaseUrl)
}

export async function apiGet<T>(path: string): Promise<T> {
  if (!apiBaseUrl) throw new ApiError('The spending API is not configured.', 503)
  const response = await fetch(`${apiBaseUrl}${path}`, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new ApiError(`The spending API returned ${response.status}.`, response.status)
  return response.json() as Promise<T>
}
