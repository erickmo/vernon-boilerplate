import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEntityService } from '@/services/createEntityService'

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}))

vi.mock('@/services/api.client', () => ({
  apiClient: {
    get: getMock,
  },
}))

describe('createEntityService', () => {
  beforeEach(() => {
    getMock.mockReset()
  })

  it('serializes tuple sort and filter params into the query string', async () => {
    getMock.mockResolvedValue({
      items: [],
      total: 0,
      limit: 25,
      offset: 50,
    })

    const service = createEntityService<{ id: string }>('/api/items')

    await service.list({
      limit: 25,
      offset: 50,
      sort: [
        ['name', 1],
        ['updatedAt', -1],
      ],
      filters: [
        ['status', '=', 'Active'],
        ['priority', '>=', 2],
      ],
      search: 'project',
    })

    expect(getMock).toHaveBeenCalledTimes(1)

    const [url] = getMock.mock.calls[0] as [string]
    const parsed = new URL(url, 'http://localhost')

    expect(parsed.pathname).toBe('/api/items')
    expect(parsed.searchParams.get('limit')).toBe('25')
    expect(parsed.searchParams.get('offset')).toBe('50')
    expect(parsed.searchParams.get('search')).toBe('project')
    expect(JSON.parse(parsed.searchParams.get('sort') ?? 'null')).toEqual([
      ['name', 1],
      ['updatedAt', -1],
    ])
    expect(JSON.parse(parsed.searchParams.get('filters') ?? 'null')).toEqual([
      ['status', '=', 'Active'],
      ['priority', '>=', 2],
    ])
  })
})
