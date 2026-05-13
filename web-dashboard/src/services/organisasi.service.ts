import { apiClient } from './api.client'
import type { PaginatedResponse } from '@/types/api.types'
import type { ListParams } from './createEntityService'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Organisasi {
  name: string
  nama: string
  jenis_organisasi?: string
  email?: string
  telepon?: string
  status: 'Aktif' | 'Nonaktif'
  logo?: string
  npwp?: string
  alamat?: string
  owner_user?: string
}

export interface CreateOrganisasiPayload {
  nama: string
  jenis_organisasi?: string
  email?: string
  telepon?: string
  npwp?: string
  alamat?: string
  owner_nama?: string
  owner_email?: string
  owner_password?: string
}

export type UpdateOrganisasiPayload = Partial<CreateOrganisasiPayload> & {
  status?: 'Aktif' | 'Nonaktif'
  logo?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RESOURCE = '/api/resource/Organisasi'
const FIELDS = JSON.stringify(['name', 'nama', 'jenis_organisasi', 'email', 'telepon', 'status', 'logo', 'npwp', 'alamat'])

// ─── Response helpers ─────────────────────────────────────────────────────────

interface FrappeListResponse<T> { data: T[] }
interface FrappeSingleResponse<T> { data: T }

// ─── Service ──────────────────────────────────────────────────────────────────

export const organisasiService = {
  list: async (params: ListParams): Promise<PaginatedResponse<Organisasi>> => {
    const q = new URLSearchParams({
      fields: FIELDS,
      limit_page_length: String(params.limit ?? 100),
      limit_start: String(params.offset ?? 0),
    })

    if (params.sort && params.order) {
      q.set('order_by', `${params.sort} ${params.order}`)
    }

    if (params.search) {
      q.set('or_filters', JSON.stringify([
        ['nama', 'like', `%${params.search}%`],
        ['email', 'like', `%${params.search}%`],
      ]))
    }

    const res = await apiClient.get<FrappeListResponse<Organisasi>>(`${RESOURCE}?${q}`)
    const items = res.data ?? []
    return {
      items,
      total: items.length,
      limit: params.limit ?? 100,
      offset: params.offset ?? 0,
    }
  },

  getByName: async (name: string): Promise<Organisasi> => {
    const res = await apiClient.get<FrappeSingleResponse<Organisasi>>(
      `${RESOURCE}/${encodeURIComponent(name)}?fields=${FIELDS}`,
    )
    return res.data
  },

  create: async (data: CreateOrganisasiPayload): Promise<Organisasi> => {
    const res = await apiClient.post<FrappeSingleResponse<Organisasi>>(RESOURCE, data)
    return res.data
  },

  update: async (name: string, data: UpdateOrganisasiPayload): Promise<Organisasi> => {
    const res = await apiClient.put<FrappeSingleResponse<Organisasi>>(
      `${RESOURCE}/${encodeURIComponent(name)}`,
      data,
    )
    return res.data
  },

  deleteByName: async (name: string): Promise<void> => {
    await apiClient.delete(`${RESOURCE}/${encodeURIComponent(name)}`)
  },
}
