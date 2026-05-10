import { describe, expect, it } from 'vitest'
import { serializeFilters } from '@/widgets/DataTable/filter.utils'

describe('serializeFilters', () => {
  it('returns tuple arrays in the filters query param payload', () => {
    const result = serializeFilters([
      {
        id: 'f-1',
        key: 'status',
        operator: '=',
        value: 'Active',
      },
      {
        id: 'f-2',
        key: 'priority',
        operator: '>=',
        value: 2,
      },
    ])

    expect(result).toEqual({
      filters: [
        ['status', '=', 'Active'],
        ['priority', '>=', 2],
      ],
    })
  })
})
