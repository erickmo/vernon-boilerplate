function serializeValue(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/**
 * Build a query string that preserves structured params.
 * Arrays and objects are JSON-encoded so tuple params like sort/filters stay intact.
 */
export function buildQS(params?: object): string {
  if (!params) return ''

  const q = new URLSearchParams()
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    const serialized = serializeValue(value)
    if (serialized !== null) q.set(key, serialized)
  }

  const qs = q.toString()
  return qs ? `?${qs}` : ''
}
