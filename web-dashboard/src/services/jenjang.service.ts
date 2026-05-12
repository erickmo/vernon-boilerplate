// src/services/jenjang.service.ts
import { apiClient } from './api.client'

const ENCODED = '/api/resource/Unit%20Jenjang'
const FIELDS = JSON.stringify(['name', 'nama', 'sekolah', 'tingkat', 'status'])

interface FrappeSingle<T> { data: T }
interface FrappeList<T> { data: T[] }

export interface UnitJenjang {
  name: string
  nama: string
  sekolah: string
  tingkat: string
  status: 'Aktif' | 'Non-Aktif'
}

export interface CreateJenjangPayload {
  nama: string
  sekolah: string
  tingkat: string
}

export interface UpdateJenjangPayload {
  nama?: string
  tingkat?: string
}

export const jenjangService = {
  listBySekolah: async (sekolah: string): Promise<UnitJenjang[]> => {
    const filters = JSON.stringify([['sekolah', '=', sekolah]])
    const res = await apiClient.get<FrappeList<UnitJenjang>>(
      `${ENCODED}?fields=${FIELDS}&filters=${filters}&order_by=tingkat+asc&limit=50`
    )
    return res.data ?? []
  },

  create: async (data: CreateJenjangPayload): Promise<UnitJenjang> => {
    const body = { nama: data.nama, sekolah: data.sekolah, tingkat: data.tingkat, status: 'Aktif' }
    const res = await apiClient.post<FrappeSingle<UnitJenjang>>(ENCODED, body)
    return res.data
  },

  update: async (name: string, data: UpdateJenjangPayload): Promise<UnitJenjang> => {
    const res = await apiClient.put<FrappeSingle<UnitJenjang>>(
      `${ENCODED}/${encodeURIComponent(name)}`,
      data
    )
    return res.data
  },

  deleteByName: async (name: string): Promise<void> => {
    await apiClient.delete(`${ENCODED}/${encodeURIComponent(name)}`)
  },
}
