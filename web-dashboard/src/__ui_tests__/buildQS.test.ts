import { describe, expect, it } from 'vitest'
import { buildQS } from '@/utils/buildQS'

describe('buildQS', () => {
  it('JSON-encodes array params and skips empty values', () => {
    const qs = buildQS({
      limit: 25,
      offset: 50,
      search: 'project',
      sort: [
        ['name', 1],
        ['updatedAt', -1],
      ],
      filters: [],
      empty: '',
      nil: null,
    })

    const parsed = new URL(`http://localhost/${qs}`)

    expect(parsed.searchParams.get('limit')).toBe('25')
    expect(parsed.searchParams.get('offset')).toBe('50')
    expect(parsed.searchParams.get('search')).toBe('project')
    expect(JSON.parse(parsed.searchParams.get('sort') ?? 'null')).toEqual([
      ['name', 1],
      ['updatedAt', -1],
    ])
    expect(parsed.searchParams.get('empty')).toBeNull()
    expect(parsed.searchParams.get('nil')).toBeNull()
  })
})
