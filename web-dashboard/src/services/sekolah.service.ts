// src/services/sekolah.service.ts
import { apiClient } from './api.client'

const RESOURCE = '/api/resource/Sekolah'
const FIELDS = JSON.stringify(['name', 'nama', 'organisasi', 'status', 'logo'])

interface FrappeSingle<T> { data: T }
interface FrappeList<T> { data: T[] }

export interface Sekolah {
  name: string
  nama: string
  organisasi: string
  status: 'Aktif' | 'Non-Aktif'
  logo?: string
}

export interface CreateSekolahPayload {
  nama: string
  organisasi: string
  status?: 'Aktif' | 'Non-Aktif'
  jenis?: string
}

export interface UpdateSekolahPayload {
  nama?: string
  status?: 'Aktif' | 'Non-Aktif'
}

export const sekolahService = {
  listByOrganisasi: async (organisasi: string): Promise<Sekolah[]> => {
    const filters = JSON.stringify([['organisasi', '=', organisasi]])
    const res = await apiClient.get<FrappeList<Sekolah>>(
      `${RESOURCE}?fields=${FIELDS}&filters=${filters}&order_by=nama+asc&limit=200`
    )
    return res.data ?? []
  },

  create: async (data: CreateSekolahPayload): Promise<Sekolah> => {
    const body = { nama: data.nama, organisasi: data.organisasi, status: data.status ?? 'Aktif', jenis: data.jenis ?? 'Reguler' }
    const res = await apiClient.post<FrappeSingle<Sekolah>>(RESOURCE, body)
    return res.data
  },

  update: async (name: string, data: UpdateSekolahPayload): Promise<Sekolah> => {
    const res = await apiClient.put<FrappeSingle<Sekolah>>(
      `${RESOURCE}/${encodeURIComponent(name)}`,
      data
    )
    return res.data
  },

  deleteByName: async (name: string): Promise<void> => {
    await apiClient.delete(`${RESOURCE}/${encodeURIComponent(name)}`)
  },
}
