import { apiClient } from './api.client'
import type { PaginatedResponse } from '@/types/api.types'
import type { FilterTuple } from '@/widgets/DataTable/filter.types'
import { buildQS } from '@/utils/buildQS'

export type SortDirection = 1 | -1
export type SortTuple = [string, SortDirection]

export interface ListParams {
  limit?: number
  offset?: number
  sort?: SortTuple[]
  filters?: FilterTuple[]
  search?: string
  [key: string]: unknown
}

export function createEntityService<T, TApi = T>(
  basePath: string,
  transform?: (raw: TApi) => T,
  responseWrapper?: string,
) {
  return {
    list: async (params?: ListParams): Promise<PaginatedResponse<T>> => {
      const response = await apiClient.get<Record<string, PaginatedResponse<TApi>>>(
        `${basePath}${buildQS(params)}`,
      )
      const raw: PaginatedResponse<TApi> = responseWrapper
        ? response[responseWrapper]
        : (response as unknown as PaginatedResponse<TApi>)
      return {
        ...raw,
        items: transform ? raw.items.map(transform) : (raw.items as unknown as T[]),
      }
    },

    getById: async (id: string): Promise<T> => {
      const raw = await apiClient.get<TApi>(`${basePath}/${id}`)
      return transform ? transform(raw) : (raw as unknown as T)
    },

    create: (data: Partial<T>): Promise<T> =>
      apiClient.post<T>(basePath, data),

    update: (id: string, data: Partial<T>): Promise<T> =>
      apiClient.put<T>(`${basePath}/${id}`, data),

    delete: (id: string): Promise<void> =>
      apiClient.delete<void>(`${basePath}/${id}`),
  }
}
